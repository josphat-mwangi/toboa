require('dotenv').config();
const db         = require('./config/database');
const express    = require('express');
const axios = require('axios')
const UssdMenu   = require('ussd-builder');
const TicketData = require('./model/model')
db.connect()
const counties = require("./config/county.json");
const { get } = require('mongoose');
console.log('counties', counties)
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended:true }));



const mombasa = counties[0].mombasa.lat
console.log('mombasa', mombasa)

let menu = new UssdMenu();

let dataToSave = {}

const atCredentials = {
    apiKey  : process.env.AT_SANDBOX_APIKEY,
    username: process.env.AT_SANDBOX_USERNAME
}

const AfricasTalking = require('africastalking')(atCredentials)

const sms = AfricasTalking.SMS


menu.startState({
    run: () =>{
        menu.con('Welcome to Toboa: ' + '\n1. Get Started ' + '\n2. Exit!');
    },
    next:{
        '1': 'register',
        '2': 'quit'
    }
});

menu.state('register', {
    run: () =>{
        menu.con('Please state your name / company')
    },
    next: {
        '*[a-zA-Z]+': 'register.location'
    }
});

menu.state('register.location', {
    run: () => {
        let name = menu.val;
        dataToSave.name = name;
        console.log(dataToSave);
        
        menu.con('Enter your county');

    },

    next: {
    
        '*[a-zA-Z]+': 'county'
    }
})

menu.state('county', {
    run: async () => {
        console.log('function called')
        let _county        = menu.val;
        dataToSave.county  = _county;
        console.log(dataToSave)
        let county_ = _county.toLowerCase()
        console.log('county entered by user', county_)

       
        let listOfCounties = counties[0];
        let selectedCounty = listOfCounties[county_];

        console.log({
            selectedCounty,
            _county
        })
        if(selectedCounty){
            let lat = selectedCounty.lat
            let lon = selectedCounty.lon
            
            let url =  `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=7246bc8a04a3da01848d4a09fcede71d`
            
            await axios.get(url)
              
              .then((response) => {
                console.log('response 1', response.data.weather[0].main)
                console.log('response 2', response.data.wind.speed)
                
                if(response.data.wind.speed > 6 ){
                    if(response.data.weather[0].main === "Sunny"){
                        // both\\\
                        menu.con('The weather is favourable for both wind and solar press yes to order both wind turbine and solar for Ksh 150.Press 1 to order '+ '\n1. Yes ' + '\n2. No')
                    }else{
                        // wind tib
                        menu.con('The weather is favourable for wind turbine. Press 1 to order for Ksh 100 '+ '\n1. Yes ' + '\n2. No')
                    }
                }
                else{
                    if(response.data.weather[0].main === "Sunny"){
                        // solar
                        menu.con('The weather is favourable for solar press yes. Press 1 to order Ksh 100 ' + '\n1. Yes ' + '\n2. No')
                    }else{
                        // not available
                        menu.end('Weather is not favourable to rent our equipments')
                    }
                }
               
            })
              .catch(function (error) {
                // handle error
                console.log(error);
              })   
        }else{
            menu.con(`${Object.keys(listOfCounties).toString("\n")} ` + " Please retype any of the given county");
            
        }
    },
    next: {
        '1': 'Yes',
        '2': 'No',
        
    }
});


menu.state('Yes', {
    run: async () =>{
        
        dataToSave.phoneNumber = menu.args.phoneNumber;
        console.log(dataToSave);

        // save data
        const data = new TicketData({
            name       : dataToSave.name,
            county     : dataToSave.county,
            phoneNumber: dataToSave.phoneNumber
        });

        const dataSaved = await data.save();
        console.log(menu.args.phoneNumber)
        const options = {
            to     : menu.args.phoneNumber,
            message: `Hi ${dataToSave.name}, Your request has been saved. We will call you for further steps`
        }

        await sms.send(options)
                .then( response =>{
                    console.log(response)
                })
                .catch( error => {
                    console.log(error)
                })

        menu.end('Awesome! Kindly Await for payment Promote.' + "\n Kindly check Your SMS thank")
    }
});

menu.state('No', {
    run: async () =>{
        
        dataToSave.phoneNumber = menu.args.phoneNumber;
        console.log(dataToSave);

        // save data
        const data = new TicketData({
            name       : dataToSave.name,
            county     : dataToSave.county,
            phoneNumber: dataToSave.phoneNumber
        });

        const dataSaved = await data.save();
        menu.end('Awesome! Goodbye')
    }
});
menu.state('quit', {
    run: () =>{
        menu.end("Goodbye")
    }
})

app.post('/ussd', (req, res)=>{
    menu.run(req.body, ussdResult => {
        res.send(ussdResult)
    })
})




app.listen(3000, async () => console.log('App running on port 3000'));
