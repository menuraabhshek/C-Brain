var RefudAmmount = 100;    ///Scrw Refund Emmount
var TaxiCancelDriverPunish = 300;
var TaxiTansferPunish = 150;

var Price_Vehicals = {
     TTUK: 70,
     CMIN: 100,
     CMED: 120,
     VMIN: 140,
     VMED: 160
}


const commissionRanges = [
     { range: [0, 3], rate: ConvertCommitionRate(0), cap: 0 },          // 0% commission
     { range: [3, 7], rate: ConvertCommitionRate(5), cap: 50 },     // 3% commission
     { range: [7, 13], rate: ConvertCommitionRate(6), cap: 100 },    // 5% commission
     { range: [13, 20], rate: ConvertCommitionRate(7), cap: 150 },  // 7% commission
     { range: [20, 40], rate: ConvertCommitionRate(8), cap: 200 },  // 8% commission
     { range: [40, 70], rate: ConvertCommitionRate(9), cap: 250 },  // 9% commission
     { range: [70, 100], rate: ConvertCommitionRate(10), cap: 300 }, // 10% commission
     { range: [100, 150], rate: ConvertCommitionRate(11), cap: 400 }, // 10% commission
     { range: [150, Infinity], rate: ConvertCommitionRate(12), cap: 600 } // 12% commission for 150+ km
];

var JoblinePostPrice=10;

const JobLineCommition=1;
const JobLineCommitionMin=10;
const JobLineCommitionCap=500;
const JobLineOwnerThankPayment=60



const HotelTankpayment=200;
const HotelBillingCommiton=5;    // this is after ending gust access comitionfrom all billed
const HotelBillingCommitonCap=1000 ;  /// this is max getting commion ammount
const HotelBillingCommitonMin=100;



















function BillPaid(id, payment, callbak) {
     var Type = payment.T;
     var BILL = payment.BIL;
     
     if ('TAXI_BILED' == Type) {
          EscrowRefund(id, function () {
               var masage = MakeBill('Billed', ConvertBillList(BILL, { AD: "Distance ", BT: "Time ", CB: "Base", DA: "\nAmount" }));
               SEND("POST", SCT_URL + "/SMS/", '', { N: Get_ROM_Number(id), M: masage }, function () { callbak(); });
          });
     }
}





////////////////////////////////////////////////////     SMS ALELT SERVICE         //////////////////////////////////////////////////////////////






function calculateSMSCredits(text) {
     const gsm7Pattern = /^[\x00-\x7F€£¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!"#¤%&'()*+,-./0-9:;<=>?@A-Z[\]ˆ_{}a-zÄÖÑÜ§äöñüà^\\|]*$/;
     const isGSM7 = gsm7Pattern.test(text);
     let smsLength, segmentSize, perSegmentSize;
     if (isGSM7) {
          smsLength = 160; 
          perSegmentSize = 153; 
     } else {
          smsLength = 70;
          perSegmentSize = 67;
     }
     let totalLength = [...text].length;
     let smsCount = totalLength === 0 ? 0 : (totalLength <= smsLength ? 1 : Math.ceil(totalLength / perSegmentSize));

     return { smsCount, totalLength, encoding: isGSM7 ? "GSM-7" : "Unicode (UCS-2)" };
}

////////////////////////////////////////////////////     useble Functions         //////////////////////////////////////////////////////////////

function ConvertBillList(data, Changer) {
     Changer = Changer || {};
     var FullString = '';

     Object.keys(data).forEach(function (key) {
          if (key in Changer) {
               FullString += `${Changer[key]} - ${data[key]}\n`;
          } else {
               FullString += `${key} - ${data[key]}\n`;
          }
     });

     return FullString;
}

function EscrowRefund(id, callback) {
     CpayTopup(id,RefudAmmount,"TAXI REFUND",function(){
          if (callback) {
               callback();
          }
     })
}

function GetCpayCurentBal(id, callback) {
     GetCpayPrice(id,callback);
}


var BillTemplate = {
     Billed: `Taxi Payment Successfully Settled!\n\n{BILLITEM}\n\nEscrow credit refunded!`
}

function MakeBill(type, bil) {
     return BillTemplate[type].replace('{BILLITEM}', bil)
}



////////////////////////////////////////////////////     Google Sheet Data Sent Funtion         //////////////////////////////////////////////////////////////

function SelectAndSendLogType(CPAY_ID, AMOUNT,REMARK){
     const INOCM_REMARKS=["QUOTA","JOBLINE POST","JOBLINE THANK"]
     if(arrayContains(INOCM_REMARKS, REMARK)){
          Log.Income(REMARK,CPAY_ID,AMOUNT);
     }

     const TOPUP_REMARKS=["TOP UP","DIRECT TOPUP","STARTER FUND","ADMIN TOPUP","AI TOPUP"]
     if(arrayContains(TOPUP_REMARKS, REMARK)){
          Log.TopUp(REMARK,CPAY_ID,AMOUNT);
     } 
     
     const DETOPUP_REMARKS=["Mistaken Top-up Refund","ADM DEB"]
     if(arrayContains(DETOPUP_REMARKS, REMARK)){
          Log.TopUp(REMARK,CPAY_ID,"-"+AMOUNT);
     } 
     
     console.log(REMARK);
}

function arrayContains(array, item) {
     return array.some(listItem => listItem.includes(item) || item.includes(listItem));
}

var Log = {
     Income: function (type, from, amount, calback) {
          const logData = {
               TP: type,
               FR: from,
               A: amount,
               TM: getCurrentdate(),
               MO: getCurrentMonth()
          };

          STORE("INCOME", formatDataForFirestore(logData), function (response) {
               if (calback) {
                    calback(response);
               }

          });
          AddIncomeToSheet(logData.MO, type, from, amount);
     },
     TopUp: function (type, id, amount) {
          const logData = {
               TP: type,
               FR: id,
               A: amount,
               TM: getCurrentdate(),
               MO: getCurrentMonth()
          };

          AddTopUpToSheet(logData.MO, type, id, amount);
     }
};

var PROJECT_ID = `cyloprofi`;
function STORE(path, data, callback) {
     var FullParth = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}`

     fetch(FullParth, {
          method: "POST",
          headers: {
               "Content-Type": "application/json",
          },
          body: JSON.stringify({
               fields: data
          }),
     })
          .then((response) => response.json())
          .then((result) => {
               console.log("Response:", result);
               if (callback) callback(result);
          })
          .catch((error) => {
               console.error("Error:", error);
          });
}


function formatDataForFirestore(data) {
     var formattedData = {};
     for (var key in data) {
          if (data.hasOwnProperty(key)) {
               var value = data[key];
               if (typeof value === "string") {
                    formattedData[key] = { stringValue: value };
               } else if (typeof value === "number") {
                    // Check if it's an integer or float
                    if (Number.isInteger(value)) {
                         formattedData[key] = { integerValue: value };
                    } else {
                         formattedData[key] = { doubleValue: value };
                    }
               } else if (typeof value === "boolean") {
                    formattedData[key] = { booleanValue: value };
               } else if (value instanceof Date) {
                    formattedData[key] = { timestampValue: value.toISOString() };
               } else if (Array.isArray(value)) {
                    formattedData[key] = { arrayValue: { values: value.map(formatArrayElement) } };
               } else if (typeof value === "object" && value !== null) {
                    formattedData[key] = { mapValue: { fields: formatDataForFirestore(value) } };
               } else if (value === null) {
                    formattedData[key] = { nullValue: null };
               }
          }
     }
     return formattedData;
}

function formatArrayElement(element) {
     if (typeof element === "string") {
          return { stringValue: element };
     } else if (typeof element === "number") {
          return Number.isInteger(element) ? { integerValue: element } : { doubleValue: element };
     } else if (typeof element === "boolean") {
          return { booleanValue: element };
     } else if (element instanceof Date) {
          return { timestampValue: element.toISOString() };
     } else if (Array.isArray(element)) {
          return { arrayValue: { values: element.map(formatArrayElement) } };
     } else if (typeof element === "object" && element !== null) {
          return { mapValue: { fields: formatDataForFirestore(element) } };
     } else if (element === null) {
          return { nullValue: null };
     }
     return { stringValue: String(element) }; // Default fallback
}



//PROJECT_ID

function queryFirestore({ collection, filters, callback }) {
     const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;

     const queryBody = {
          structuredQuery: {
               from: [{ collectionId: collection }],
               where: {
                    compositeFilter: {
                         op: "AND", // Combines all conditions using AND
                         filters: filters.map((filter) => ({
                              fieldFilter: {
                                   field: { fieldPath: filter.field },
                                   op: filter.op,
                                   value: filter.value,
                              },
                         })),
                    },
               },
          },
     };

     fetch(url, {
          method: "POST",
          headers: {
               "Content-Type": "application/json",
          },
          body: JSON.stringify(queryBody),
     })
          .then((response) => response.json())
          .then((result) => {
               if (Array.isArray(result)) {
                    console.log("Filtered Data:", result);
                    if (callback) callback(result.filter(item => item.document));
               } else {
                    console.error("Query Error:", result);
               }
          })
          .catch((error) => {
               console.error("Error:", error);
          });
}





function getCurrentMonth() {
     const date = new Date();
     const monthNames = [
          "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY",
          "JUNE", "JULY", "AUGUST", "SEPTEMBER",
          "OCTOBER", "NOVEMBER", "DECEMBER"
     ];
     return monthNames[date.getMonth()];
}





function AddIncomeToSheet(month, type, from, amount) {
     const formUrl = "https://docs.google.com/forms/d/e/1FAIpQLSe_GBcWqMBtmqWrqZK_n5sYJRW2on3SQJNebDsdOUU7CSov6g/formResponse";
 
     const formData = new FormData();
     formData.append("entry.1238968933", month);  // Month field
     formData.append("entry.27859628", type);     // Type field
     formData.append("entry.788353109", from);    // From field
     formData.append("entry.1349171897", amount); // Amount field
 
     fetch(formUrl, {
         method: "POST",
         body: formData,
         mode: "no-cors" // Prevent CORS errors
     }).then(() => {
         console.log("Data submitted successfully!");
     }).catch(error => {
         console.error("Error submitting data:", error);
     });
 }



 function AddTopUpToSheet(month, type, id, amount) {
     const formUrl = "https://docs.google.com/forms/d/e/1FAIpQLScKibXBZQxHCWaOJzXVj9kFb6xB-ExohJOQDE--xCKDEc5dFw/formResponse";
 
     const formData = new FormData();
     formData.append("entry.2130797771", month);  // Month field
     formData.append("entry.424362030", type);    // Type field
     formData.append("entry.1954648541", id);     // User ID field
     formData.append("entry.958943294", amount);  // Amount field
 
     fetch(formUrl, {
         method: "POST",
         body: formData,
         mode: "no-cors"
     }).then(() => {
         console.log("Top-up data submitted successfully!");
     }).catch(error => {
         console.error("Error submitting top-up data:", error);
     });
 }

 function AddTransferToSheet(amount, from, to,remark) {
     const formUrl = "https://docs.google.com/forms/d/e/1FAIpQLSe2uNKqVOWDays8yPP48pnhm_-ni3a5ZYkLZHSM-OPV5TTLxg/formResponse";
 
     const formData = new FormData();
     formData.append("entry.329352785", getCurrentMonth());  // Month field
     formData.append("entry.1883989742", amount);    // Type field
     formData.append("entry.1618312676", from);     // User ID field
     formData.append("entry.835374640", to);  // Amount field
     formData.append("entry.403208167", remark); 

     fetch(formUrl, {
         method: "POST",
         body: formData,
         mode: "no-cors"
     }).then(() => {
         console.log("Top-up data submitted successfully!");
     }).catch(error => {
         console.error("Error submitting top-up data:", error);
     });
 }


//////////////////////////////////////////////////          Getiiong Commiton         ///////////////////////////////////////////////////////////////////



function calculateCommission(distanceKm, pricePerKm, commissionMultiplier = 1) {    //// this commition is used for taxi
     // Base variables
     const baseFare = distanceKm * pricePerKm;

     // Find the applicable range
     let commission = 0;
     for (let range of commissionRanges) {
          const [min, max] = range.range;
          if (distanceKm > min && distanceKm <= max) {
               // Calculate commission with multiplier
               commission = Math.min(baseFare * range.rate * commissionMultiplier, range.cap);
               break;
          }
     }

     
     return parseInt(commission)
}

function ConvertCommitionRate(comition) {
     return comition / 100
}



function getCommissionPrice(price, commissionPercentage) {
     return parseInt(((price * commissionPercentage) / 100));
}


function GetHotelCommition(Amount=0){
     var Commiton=getCommissionPrice(Amount,HotelBillingCommiton);
     if(Commiton>HotelBillingCommitonCap){
          Commiton=HotelBillingCommitonCap;
     } 
     if(Commiton<HotelBillingCommitonMin){
          Commiton=HotelBillingCommitonMin;
     } 
     return parseInt(Commiton);
}

function GetJobLineCommition(Amount=0){
     var Commiton=getCommissionPrice(Amount,JobLineCommition);
     if(Commiton>JobLineCommitionCap){
          Commiton=JobLineCommitionCap;
     } 
     if(Commiton<JobLineCommitionMin){
          Commiton=JobLineCommitionMin;
     } 
     return parseInt(Commiton);
}
