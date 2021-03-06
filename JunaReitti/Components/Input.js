import React, {Component} from "react";
import {StyleSheet, TextInput} from "react-native";

class Input extends React.Component {

    inputHandler = (val) => {
        this.props.userInput(this.props.name, val);
    };

    render() {

        return (
        <TextInput placeholder={this.props.placeholder} style={styles.inputField} onChangeText={this.inputHandler}/>
        )
    }
}

const styles = StyleSheet.create({
    inputField: {
        width: '40%',
        marginLeft: 10,
        marginRight: 10
    }
});

export default Input;