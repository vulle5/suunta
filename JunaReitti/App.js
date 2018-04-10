import React, {Component} from "react";
import {ActivityIndicator, View, Text, StyleSheet, FlatList} from "react-native";
import {List, ListItem} from "react-native-elements";
import Autocomplete from "./Components/Autocomplete";
import sortBy from "lodash/sortBy";

export default class JunaReitti extends Component<{}> {

    constructor(props) {
        super(props);

        this.state = {
            data: [],
            isLoading: true,
            isRefreshing: false,
            lahtoAsema: '',
            tuloAsema: '',
            lahtoLyhenne: '',
            tuloLyhenne: '',
            asemat: [],
            minimiAika: 0,
            userInput: ''
        };
    }

    fetchTrainData = () => {

        if(this.state.tuloLyhenne !== '' && this.state.lahtoLyhenne !== '') {
            this.setState({
                isRefreshing: true,
                minimiAika: 99999999
            });
            let currentTime = new Date();
            let currentTimeISO = currentTime.toISOString();
            let currentTimeISODate = new Date(currentTimeISO);

            fetch('https://rata.digitraffic.fi/api/v1/live-trains/station/'+this.state.lahtoLyhenne+'/'+this.state.tuloLyhenne + '?limit=15&startDate=' + currentTimeISO)
                .then((response) => response.json())
                .then(junat => junat.map(juna => {

                    const fetchDepDate = new Date(juna.timeTableRows.filter((row) => row.stationShortCode === this.state.lahtoLyhenne && row.trainStopping === true && row.type === 'DEPARTURE' && new Date(row.scheduledTime)>currentTimeISODate)[0].scheduledTime);
                    const finalDepDate = fetchDepDate.getHours() + ":" + ("0"+fetchDepDate.getMinutes()).slice(-2);
                    const fetchArrDate = new Date(juna.timeTableRows.filter((row) => row.stationShortCode === this.state.tuloLyhenne && row.trainStopping === true && row.type === 'ARRIVAL' && new Date(row.scheduledTime)>fetchDepDate)[0].scheduledTime);
                    const finalArrDate = fetchArrDate.getHours() + ":" + ("0"+fetchArrDate.getMinutes()).slice(-2);

                    const traveltime = (fetchArrDate-fetchDepDate)/1000;
                    if (this.state.minimiAika > traveltime) {
                        this.setState({
                            minimiAika: traveltime
                        });
                    }

                    const trainType = juna.commuterLineID !== "" ? juna.commuterLineID : juna.trainType + juna.trainNumber;

                    //juna.commuterLineID
                    //juna.filter((row) => row.commuterLineID === "" ? row.trainType : row.commuterLineID)
                        return {
                            id: juna.trainNumber,
                            tunnus: trainType,
                            lahtoPvm: fetchDepDate,
                            lahtoAika: finalDepDate,
                            lahtoRaide: juna.timeTableRows.filter((row) => row.stationShortCode === this.state.lahtoLyhenne && row.trainStopping === true && row.type === 'DEPARTURE')[0].commercialTrack,
                            tuloAika: finalArrDate,
                            matkaAika: traveltime
                        }
                    })
                )
                .catch(error => console.log(error))
                .then((responseJson) => {
                    this.setState({
                        isLoading: false,
                        data: responseJson,
                        isRefreshing: false,
                    })
                })
                .catch((error) => {
                    console.error(error);
                });
        }
        };

    handleInput = (type, userInput) => {
        userInput.trim();
        console.log(userInput);
        console.log(this.state.userInput);
        for (let asema in this.state.asemat) {
            if (userInput === this.state.asemat[asema].stationName) {
                if (type === "lahto") {
                    this.setState({
                        lahtoAsema: this.state.asemat[asema].stationName,
                        lahtoLyhenne: this.state.asemat[asema].stationShortCode
                    }, () => {
                        this.fetchTrainData();
                    });
                } else if (type === "tulo") {
                    this.setState({
                            tuloAsema: this.state.asemat[asema].stationName,
                            tuloLyhenne: this.state.asemat[asema].stationShortCode
                        }, () => {
                            this.fetchTrainData();
                        });
                }
            }
        }
    };

    componentDidMount() {
        fetch('https://rata.digitraffic.fi/api/v1/metadata/stations')
            .then((response) => response.json())
            .then(asemat => asemat.filter((asema) => asema.passengerTraffic === true))
            .then(asemat => asemat.map(asema => {
                    return {
                        id: asema.stationUICCode,
                        stationShortCode: asema.stationShortCode,
                        stationName: asema.stationName.split(" ")[1] === "asema" ? asema.stationName.split(" ")[0] : asema.stationName,
                        passengerTraffic: asema.passengerTraffic
                    }
                })
            )
            .then(asemat => this.setState({
            isLoading: false,
            asemat: asemat}));
    }

    onRefresh = async () => {
        this.setState({
            isRefreshing: true
        });

        //await this.fetchTrainData();

        await this.setState({
            data: this.fetchTrainData()
        });

        this.setState({
            isRefreshing: false
        });

    };

    renderHeader() {
        return (
            <View style={styles.junalista}>
                <Text>Tunnus</Text>
                <Text>Lähtöaika</Text>
                <Text>Lähtöraide</Text>
                <Text>Tuloaika</Text>
            </View>
        );
    };

    renderItem({item, index}) {
        return (
            <View style={styles.junalista}>
                <Text style={styles.tunnus}>  {item.tunnus}</Text>
                <Text>{item.lahtoAika}</Text>
                <Text>{item.lahtoRaide}</Text>
                <Text>{item.tuloAika}</Text>
            </View>
        );
    }

    render() {

        if (this.state.isLoading) {
            return (
                <View style={{flex: 1, paddingTop: 40}}>
                    <ActivityIndicator/>
                </View>
            );
        }

        return (
            <View style={{flex: 1, paddingTop: 0}}>
              <FlatList style={styles.listContainer}
                data = {sortBy(this.state.data, 'lahtoPvm').filter(juna => juna.matkaAika < this.state.minimiAika*2.1)}
                keyExtractor = {item => item.id.toString()}
                ListHeaderComponent = {this.renderHeader}
                renderItem = {this.renderItem}
                onRefresh={this.onRefresh}
                refreshing={this.state.isRefreshing}
              />
              <View style={styles.autoContainer}>
                <Autocomplete stations={this.state.asemat} placeholder="Lähtöasema" name="lahto" userInput={this.handleInput}/>
                <Autocomplete stations={this.state.asemat} placeholder="Tuloasema" name="tulo" userInput={this.handleInput}/>
              </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    inputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    junalista: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: 50
    },
    junat: {
        fontSize: 20
    },
    junatHeader: {
        fontSize: 20,
        fontWeight: 'bold'
    },
    tunnus: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    autoContainer: {
        position:'absolute',
        top: 0,
        flexDirection: 'row',
    },
    listContainer: {
        position:'absolute',
        top: 42,
        width: '100%'
    },
});
