import Handlebars from 'handlebars/dist/handlebars'
import rp from 'request-promise'
import mainTemplate from './src/templates/main.html!text'


// Handlebars.registerHelper("ifvalue", function(conditional, options) {
//     if (conditional == options.hash.equals) {
//         return options.fn(this);
//     } else {
//         return options.inverse(this);
//     }
// }); DELETE

// old 2017 F100 url https://interactive.guim.co.uk/docsdata/1ijYpfwo56EuZuE98Qj1k11WMJC-SRTKj_12kw-Pcrvs.json

// old premiership 2018 https://interactive.guim.co.uk/docsdata/15oX1N8uGCfeljcVD-1o1BXYju0_V7YDi6WwpjjWN4XQ.json

// new premiership 2019 https://interactive.guim.co.uk/docsdata/1HDhilyyWKPxxNUsUzEsB1vtihj0VuKaBn5WhYJTLgdA.json


export function render() {
    return rp({
        uri: 'https://interactive.guim.co.uk/docsdata-test/1GdI8BEWzAB6CG8CkgSaypYhm9f9rje-kTNgBTe8_lXc.json',
        json: true
    }).then((data) => {
        var sheets = data.sheets;        
        //var maxSteps = sheets.Floors.length; DELETE

        // sheets.Floors.map((obj,k)=>{
        //     obj.maxSteps = maxSteps; //aded maxSteps ref for app.js

        //     if(obj.Victims_status){
        //         obj.hasVictims = true;
        //     }else{
        //         obj.hasVictims = false;
        //     }

        //     console.log(obj.hasVictims);


        // }) DELETE

        var hbMainTemplate = Handlebars.compile(mainTemplate);
        var compiled = hbMainTemplate(sheets);
        var html = compiled;
        return html;
    });

  
}

