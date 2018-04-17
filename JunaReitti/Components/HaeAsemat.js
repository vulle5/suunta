import React, { Component } from 'react';
import { Button, ToastAndroid } from 'react-native';
import geolib from 'geolib';
import Permissions from 'react-native-permissions';
import { Icon } from "react-native-elements";

export default class HaeAsemat extends Component {
    
    constructor(props) {
        super(props);

        this.state = {
            latitude: null,
            longitude: null,
            error: null,
            lahinAsema: ''
        }
    }

    getClosestStation = () => {
        console.log("Hakee asemia");
        
        let i = 1;
        i++;
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log(position);
                this.setState({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    error: null,
                },() => {
                    
                    let nykyinenSijainti = {"paikka": {latitude: this.state.latitude, longitude: this.state.longitude}}

                    //Haetaan asemien sijainnit ja formatoidaan ne oikeaan muotoon
                    let asemaSijainnit = {};
                    
                    for (var asema in this.props.asemat) {
                        let nimi = this.props.asemat[asema].stationName;
                        
                        asemaSijainnit[nimi] = {latitude: this.props.asemat[asema].latitude, longitude: this.props.asemat[asema].longitude}
                    }
                    
                    //Verrataan omaa sijaintia juna-asemien sijaintiin
                    let result = geolib.findNearest(nykyinenSijainti['paikka'], asemaSijainnit, 0);

                    console.log('Kutsutaan handleDeparttia parametrilla: ' + result.key);
                   // Tämä pitää muuttaa, jotta sijainti menee inputfieldiin this.handleDepartInput(result.key);
                    this.props.input(result.key);
                });
            },
            (error) => {console.log(error); this.setState({ error: error.message }); ToastAndroid.show(`${error.message} haetaan uudestaan (yritys ${i}) max 4`, ToastAndroid.SHORT); if (i <= 4) {this.getClosestStation()}},
            { enableHighAccuracy: false, timeout: 5000, maximumAge: 5000 },
        );        
    };

    render() {

        return(
            <Icon
                name={'location-on'}
                size={26}
                onPress={ 
                    requestPermission = () => {
                        Permissions.request('location').then(response => {
                            // Returns once the user has chosen to 'allow' or to 'not allow' access
                            // Response is one of: 'authorized', 'denied', 'restricted', or 'undetermined'
                            setLocationResponse={response};
                            this.getClosestStation()
                        })
                    }
                }
                title="Sijainti"
            />
        )
    }
}