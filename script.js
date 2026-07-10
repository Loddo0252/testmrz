/*
====================================================
 ICAO 9303 MRZ GENERATOR
 Pure Vanilla JavaScript
 No Frameworks
====================================================
*/


// ================================
// ELEMENT REFERENCES
// ================================

const documentType = document.getElementById("documentType");
const issuingCountry = document.getElementById("issuingCountry");
const nationality = document.getElementById("nationality");

const surname = document.getElementById("surname");
const givenNames = document.getElementById("givenNames");

const documentNumber = document.getElementById("documentNumber");
const birthDate = document.getElementById("birthDate");
const expiryDate = document.getElementById("expiryDate");

const sex = document.getElementById("sex");
const personalNumber = document.getElementById("personalNumber");


const mrzOutput = document.getElementById("mrzOutput");
const checks = document.getElementById("checks");

const loading = document.getElementById("loading");
const toast = document.getElementById("toast");



// ================================
// ICAO CHARACTER CLEANING
// ================================


function cleanICAO(value){

    return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g,"")
    .trim();

}



// Replace spaces with ICAO filler

function nameFormat(value,length){

    let text = cleanICAO(value);

    text = text.replace(/ /g,"<");

    return text
    .padEnd(length,"<")
    .substring(0,length);

}




// ================================
// DATE FORMAT
// ================================


function formatMRZDate(date){


    if(!date)
        return "000000";


    let d = new Date(date);


    let year =
    String(d.getFullYear()).slice(-2);


    let month =
    String(d.getMonth()+1)
    .padStart(2,"0");


    let day =
    String(d.getDate())
    .padStart(2,"0");


    return year + month + day;

}




// ================================
// ICAO CHECK DIGIT
// WEIGHT 7-3-1
// ================================


function calculateCheckDigit(data){


    const weights=[7,3,1];


    let sum=0;


    for(let i=0;i<data.length;i++){


        let value=data[i];


        let number;


        if(/[0-9]/.test(value)){


            number =
            parseInt(value);


        }

        else if(/[A-Z]/.test(value)){


            number =
            value.charCodeAt(0)-55;


        }

        else {


            number=0;


        }



        sum += number * weights[i%3];


    }



    return sum % 10;


}




// ================================
// RANDOM DATA
// ================================


function randomNumber(length){


    let result="";


    for(let i=0;i<length;i++){

        result +=
        Math.floor(Math.random()*10);

    }


    return result;

}



function randomLetters(length){


    let result="";


    const chars="ABCDEFGHIJKLMNOPQRSTUVWXYZ";


    for(let i=0;i<length;i++){

        result +=
        chars[Math.floor(Math.random()*chars.length)];

    }


    return result;

}




// ================================
// VALIDATION
// ================================


function validateInput(){


    let valid=true;


    const fields=[

        surname,
        givenNames,
        documentNumber,
        birthDate,
        expiryDate

    ];



    fields.forEach(field=>{


        field.classList.remove("invalid");


        if(!field.value){


            field.classList.add("invalid");

            valid=false;

        }


    });



    return valid;

}




// ================================
// TOAST MESSAGE
// ================================


function showToast(message){


    toast.textContent=message;


    toast.classList.add("show");


    setTimeout(()=>{


        toast.classList.remove("show");


    },2000);



}




// ================================
// LOADING
// ================================


function showLoading(status){


    if(status)

        loading.classList.remove("hidden");


    else

        loading.classList.add("hidden");


}
