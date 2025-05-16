var A = document.getElementById("ACOD");
var ACOD = A.value;




//////////////////////    notifications      ///////////////////////
var NotifyPannel = document.getElementById("NotifyPannel");
function SetNotifi(Color, Text) {

     var Adder = `<div style="background-color:#${colos[Color]}54" class="notifi">${Text}<div style="flex: 1;"></div><div class="Notificlas" onclick="CloaseNotification(this)">+</div></div>`;
     NotifyPannel.insertAdjacentHTML('afterbegin', Adder);


     if (NotifyPannel.childElementCount > 5) {
          RemoveLaseNotifi()
     }
     NOTIF();

}
function CloaseNotification(element) {
     RemoveLaseNotifi();
     TAP();
}
function RemoveLaseNotifi() {
     NotifyPannel.removeChild(NotifyPannel.lastChild);
}





var Alert = document.getElementById("Alert");
var Notifi = document.getElementById("Notifi");
var tap = document.getElementById("tap");
var atentsond = document.getElementById("atentsond");
function TAP() {
     tap.currentTime = 0;  // Rewind to the start
     tap.play();
}
function NOTIF() {
     Notifi.currentTime = 0;  // Rewind to the start
     Notifi.play();
}
function ALERT() {
     Alert.currentTime = 0;  // Rewind to the start
     Alert.play();
}
function ALERTSTOP() {
     Alert.currentTime = 0;  // Rewind to the start
     Alert.pause()
}

function Atant(text) {
     atentsond.currentTime = 0;  // Rewind to the start
     atentsond.play();

     if (text) {
          setTimeout(function () { speakText(text) }, 3000);
     }
}




var firstClick = false;

document.addEventListener("click", function () {
     if (!firstClick) {
          TAP();
          ALERT();
          NOTIF();
          setTimeout(ALERTSTOP, 80);
          firstClick = true
     }
});


////////////////////////////////        costom console log      /////////////////////////////////////////////////////////////////
const customConsole = {
     logs: [],
     maxLogs: 250,
     overlay: null,
     content: null,
     init() {
         this.overlay = document.getElementById("console-overlay");
         this.content = document.getElementById("console-content");
         const originalLog = console.log;
         const originalWarn = console.warn;
         const originalError = console.error;
         
         console.log = (...args) => this.addLog("log-info", "LOG", args, originalLog);
         console.warn = (...args) => this.addLog("log-warn", "WARN", args, originalWarn);
         console.error = (...args) => this.addLog("log-error", "ERROR", args, originalError);
         
         window.onerror = (msg, url, line, col, error) => {
             this.addLog("log-error", "JS ERROR", [`${msg} at ${url}:${line}:${col}`, error]);
         };
         
         window.addEventListener("unhandledrejection", (event) => {
             this.addLog("log-error", "PROMISE REJECTION", [event.reason]);
         });
         
         window.addEventListener("error", (event) => {
             this.addLog("log-error", "SYSTEM ERROR", [`${event.message} at ${event.filename}:${event.lineno}:${event.colno}`, event.error]);
         }, true);


         
     },
     addLog(type, prefix, args, originalFunc) {
         if (this.logs.length >= this.maxLogs) this.logs.shift();
         const logElement = document.createElement("div");
         logElement.className = `console-log ${type}`;
         logElement.innerHTML = `[${new Date().toLocaleTimeString()}] ${prefix}: `;
         logElement.style.marginBottom="15px"
         
         args.forEach(arg => {
             if (typeof arg === "object" && arg !== null) {
                 logElement.appendChild(this.createExpandableObject(arg));
             } else {
                 logElement.innerHTML += ` ${arg}`;
             }
         });

         if(this.customcolor){
               logElement.style.color=this.customcolor;
               this.customcolor=null;
          }
         
         this.logs.push(logElement);
         this.content.appendChild(logElement);
         if (this.overlay.style.display !== "none") this.overlay.scrollTop = this.overlay.scrollHeight;
         if (originalFunc) originalFunc.apply(console, args);
         
     },
     GoBottom(){
          this.content.scrollTop = this.content.scrollHeight;
     },
     createExpandableObject(obj) {
         const details = document.createElement("details");
         const summary = document.createElement("summary");
         summary.textContent = "(object)";
         details.appendChild(summary);
         
         for (let key in obj) {
             if (Object.prototype.hasOwnProperty.call(obj, key)) {
                 const subDetails = document.createElement("details");
                 const subSummary = document.createElement("summary");
                 subSummary.textContent = `${key}: ${typeof obj[key]}`;
                 subDetails.appendChild(subSummary);
                 
                 if (typeof obj[key] === "object" && obj[key] !== null) {
                     subDetails.appendChild(this.createExpandableObject(obj[key]));
                 } else {
                     const value = document.createElement("div");
                     value.textContent = JSON.stringify(obj[key]);
                     subDetails.appendChild(value);
                     value.style.marginLeft="20px"
                 }
                 subDetails.style.marginLeft="20px"
                 details.style.marginLeft="20px"
                 
                 details.appendChild(subDetails);
             }
         }
         return details;
     },
     customcolor:null,
     setCustomColor:function(color){
         this.customcolor=color;
     },
     toggle() {
         this.overlay.style.display = this.overlay.style.display === "block" ? "none" : "block";
     }
 };        
 
customConsole.init();

const inputField = document.getElementById("commandInput");
    
function logOutput(type, message) {     
    let color = type === "error" ? "red" : "#0f0";
    const consoleDiv=customConsole.content;
    consoleDiv.innerHTML += `<div style="color: ${color};">${message}</div>`;
    consoleDiv.scrollTop = consoleDiv.scrollHeight; // Auto scroll down
}

function executeCommand(command) {
    try {
        let result = window.eval(command); // Runs in global scope
        if (result !== undefined) logOutput("output", result);
    } catch (error) {
        logOutput("error", `Error: ${error}`);
    }
}

inputField.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        const command = inputField.value;
        setTimeout(function(){
          inputField.value = "";
        },50);       
        logOutput("command", `> ${command}`);
        executeCommand(command);
    }
});

// Capture console.log() outputs
(function() {
    let oldLog = console.log;
    console.log = function(...args) {
        args.forEach(arg => logOutput("log", arg));
        oldLog.apply(console, args);
    };
})();




////////////////////////////////    Create Brige Connection To pass data after Add New Element      ///////////////////////////
function MakeDataBrige(LisnnerParth, callback) {
     var databaseRef = database.ref(LisnnerParth);
     databaseRef.on('child_added', function (snapshot) {
          var key = snapshot.key;
          var value = snapshot.val();

          console.log(value);

          if (callback) {
               callback(Saniti(value));
               NOTIF();
          }
          databaseRef.child(key).remove();
     });
}







////////////////////////////////    Send data to data base      ///////////////////////////
function SEND(Metode, Parth, key, Data, Callback) {

     fetch(Parth + ".json?auth=" + key, {
          method: Metode,
          headers: {
               'Content-Type': 'application/json'
          },
          body: JSON.stringify(Data)
     })
          .then(response => {
               return response.json();
          })
          .then(data => {
               if (Callback) {
                    Callback(data);
               }

          });
}

////////////////////////////////    Receve data to data base      ///////////////////////////
function RECE(Parth, key, Callback) {
     fetch(Parth + ".json?auth=" + key)
          .then(response => {
               if (!response.ok) {
                    throw new Error('Network response was not ok');
               }
               return response.json();
          })
          .then(data => {
               if (Callback) {
                    Callback(data);
               }
          });
}


////////////////////////////////   Fetch DPS      ///////////////////////////
async function FetchDP(id, callBack) {

     const storageRef = storage.ref('CDP/Y.jpg');  // Specify the correct path to your image



     fetch(`https://firebasestorage.googleapis.com/v0/b/cylouni.appspot.com/o/CDP%2FY.jpg?alt=media`, {
          method: 'GET',
     })
          .then(response => {
               // In no-cors mode, the response body will be opaque
               const fileBlob = response.blob();
               console.log(fileBlob);
               UploadImage(fileBlob, id)
          })
          .catch(error => {
               console.error('Error:', error);
          });


     return
}





////////////////////////////////   Genarate FireBase ID      ///////////////////////////
function generateFirebaseKey() {
     // Generate a unique base key using timestamp and randomness
     const timestamp = Date.now(); // Current time in milliseconds
     const random = Math.random().toString(36).substring(2, 10); // Random string
     const baseKey = timestamp.toString(36) + random; // Combine timestamp and random

     // Convert to Base64-like URL-safe format to reduce length
     const firebaseKey = baseKey
          .replace(/\./g, '') // Remove invalid characters
          .replace(/\+/g, '-') // Replace "+" with URL-safe "-"
          .replace(/\//g, '_'); // Replace "/" with URL-safe "_"

     return firebaseKey;
}



///////////////////////////////////////////////    variable Tamplete    //////////////////////////////////////////////
var colos = {
     G: "2bff00",
     R: "ff0000",
     Y: "ffee00",
     B: "0400ff",
     C: "00f7ff",
     M: "ff00ea"
}

function escapeHtml(str) {
     const map = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;',
          '`': '&#x60;'
     };
     return str.replace(/[&<>"'`]/g, function (m) { return map[m]; });
}
function sanitizeInput(input) {
     // Strip out any potentially harmful tags and attributes
     const tagBody = '(?:[^"\'>]|"[^"]*"|\'[^\']*\')*';

     const tagOrComment = new RegExp(
          '<(?:' +
          // Comment body
          '!--(?:(?:-*[^->])*--+|-?)' +
          // Regular tags
          '|script\\b' + tagBody + '>[\\s\\S]*?</script\\s*' +
          '|style\\b' + tagBody + '>[\\s\\S]*?</style\\s*' +
          '|/?[a-z]' +
          tagBody +
          ')>',
          'gi'
     );

     let oldInput;
     do {
          oldInput = input;
          input = input.replace(tagOrComment, '');
     } while (input !== oldInput);

     // Escape special characters
     return input.replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;")
          .replace(/&/g, "&amp;");
}


function Saniti(obj) {
     if (typeof obj !== 'object' || obj === null) {
          // If it's not an object or it's null, return as-is
          return obj;
     }

     // Handle Array separately
     if (Array.isArray(obj)) {
          return obj.map(item => Saniti(item));
     }

     // Otherwise, it's an object: sanitize each value
     const sanitizedObj = {};
     for (let key in obj) {
          if (obj.hasOwnProperty(key)) {
               const value = obj[key];
               if (typeof value === 'string') {
                    // Sanitize the string value
                    sanitizedObj[key] = sanitizeInput(value);
               } else if (typeof value === 'object') {
                    // Recursively sanitize nested objects
                    sanitizedObj[key] = Saniti(value);
               } else {
                    // Non-string values are left as-is
                    sanitizedObj[key] = value;
               }
          }
     }
     return sanitizedObj;
}

function unsanitize(input) {
     return input.replace(/&lt;/g, "/<")      // Replace &lt; with <
          .replace(/&gt;/g, "/>")      // Replace &gt; with >
          .replace(/&quot;/g, '"')    // Replace &quot; with "
          .replace(/&#039;/g, "'")    // Replace &#039; with '
          .replace(/&amp;/g, "/&")    // Replace &amp; with &
          .replace(/\n/g, "<br>");
}



const CHAR_SET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
function GetCloudID(num) {
     if (num === 0) return CHAR_SET[0];

     let base36 = '';
     while (num > 0) {
          let remainder = num % 36;
          base36 = CHAR_SET[remainder] + base36;
          num = Math.floor(num / 36);
     }
     return base36;
}

function Cloud_To_desimal(base36Str) {
     base36Str = base36Str.toUpperCase();
     let num = 0;
     for (let i = 0; i < base36Str.length; i++) {
          num = num * 36 + CHAR_SET.indexOf(base36Str[i]);
     }
     return num;
}


function getRandomNumber(min, max) {
     return Math.floor(Math.random() * (max - min + 1)) + min;
}


//////////////  encriptions  ////////
/*
function encript(text,key){
     let asciiDecimals=0;
     let fulldeis_key=0;
     text=String(text);
     key=String(key);
     for (let i = 0; i < text.length; i++) {
         asciiDecimals+=parseInt(text.charCodeAt(i));
     }
     for (let i = 0; i < key.length; i++) {
         fulldeis_key+=parseInt(key.charCodeAt(i));
     }
     asciiDecimals=asciiDecimals*fulldeis_key;
     asciiDecimals=asciiDecimals*parseInt(text.charCodeAt(0))*parseInt(key.charCodeAt(0));
     return GetCloudID(asciiDecimals);
 }*/

function Encript(OBJ, id, isNum) {
     var secretKey;
     if (isNum) {
          secretKey = OTP.get(id) || '';;
     } else {
          secretKey = OTP.GetKey(id) || '';;
     }

     const jsonString = JSON.stringify(OBJ);

     if (secretKey == '') {
          Gosip.Sent(id, "Encript Error!", "E");
          return null;
     } else {
          const encryptedData = CryptoJS.AES.encrypt(jsonString, secretKey.toString()).toString();
          return encryptedData;
     }
}


function Decrpt(encryptedData, id, isNum) {
     var secretKey;
     if (isNum) {
          secretKey = OTP.get(id) || '';
     } else {
          secretKey = OTP.GetKey(id) || '';
     }

     if (secretKey == '') {
          Gosip.Sent(id, "Decrypt Error!", "E");
          return null;
     } else {
          const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey.toString());

          try {
               var ob = bytes.toString(CryptoJS.enc.Utf8);
          } catch (error) {
               return null;
          }


          if (ob == '') {
               Gosip.Sent(id, "Incorrect OTP.", "E");
          } else {
               return JSON.parse(ob);
          }
     }


}






//////////////////////////////////////       for uses haddles commonfuntion  //////////////////////////////////////////

async function VeryfiUser(UID, Password, OTP, rawUSeVeryfi, callBack) {
     var Chekker = true;

     var info=await getUserProfileInfo(UID,"ACC",false);

     var decriptpass = Decrpt(Password, UID, false);
     var decriptOtp = Decrpt(OTP, UID, false);

     if("BAN" in info){
          Gosip.Sent(UID,info['BAN'],"BAN");
          if(callBack!=null){
               callBack(false);
          }
          return;  
     }

     decriptpass = String(decriptpass).replace("PW", "");

     if (info['O'] == decriptOtp && info['PW'] == decriptpass) {
          Chekker = true;
          if (!rawUSeVeryfi) {
               var NewOTP = parseInt(info['O']) + parseInt(info['I'])
               SEND("PUT", Profi_url + "/ACC/" + UID + "/info/O", Profi_Secret, NewOTP);
               UptateLocalInfoOTP(UID,NewOTP)
          }
     } else {
          Gosip.Error(UID, "Authentication faileddd!");
          Chekker = false;
     }

     if (callBack != null) {
          callBack(Chekker, info);
     }


}

// add user activitis to user's cloud activitis log
function SendUserActivitiLog(userID, Catogary, text) {
     SEND("POST", Profi_url + "/ACC/" + userID + "/ACTIVITIS/", Profi_Secret, { C: Catogary, M: text, T: getCurrentdate() });
}
function SendServiseActivitiLog(seviseID, Catogary, text) {
     SEND("POST", Profi_url + "/Service/" + seviseID + "/ACTIVITIS/", Profi_Secret, { C: Catogary, M: text, T: getCurrentdate() });
}
function SendSystermLog(Catogary, text) {
     SEND("POST", Profi_url + "/TASKS", Profi_Secret, { C: Catogary, M: text, T: getCurrentdate() })
}

function ChekAllKeysIsAvaillable(recevekeys, Reqiedkeys) {
     var isAllHase = true;

     Reqiedkeys.forEach(function (key) {
          if (!recevekeys.includes(key)) {
               isAllHase = false;
          }
     });
     return isAllHase;

}
function SendSMS(Id, massage, callBack) {
     SEND("POST", SCT_URL + "/SMS/", '', { N: Get_ROM_Number(Id), M: massage }, function () {
          if (callBack) {
               callBack();
          }
     });
}

function SendSMStoNumber(Number, massage, callBack) {
     SEND("POST", SCT_URL + "/SMS/", '', { N: Number, M: massage }, function () {
          if (callBack) {
               callBack();
          }
     });
}














//////////////////////////////////////       OTP Haddleing Funtion  //////////////////////////////////////////
var OTP = {
     fetch: function () {
          RECE(Profi_url + "/" + "ENCRIPT_KEYS", Profi_Secret, function (Otps) {
               Otps=Otps||{}
               localStorage.setItem("ENCRIPT_KEYS", JSON.stringify(Otps));
               console.log(Object.keys(Otps).length + " Keys Bringed SuccessFully!");
               SetUNI_CON_ST('G', 'CLOUD FETCHED', 'Keys');
               ServiseType.fetch();
               JobLineing.FetchCloud();
          })
     },
     new: function (number) {
          var notp = generateOTP();
          var otps = localStorage.getItem("OTPS");
          otps = JSON.parse(otps);
          otps = otps || {}
          otps[number] = notp;
          localStorage.setItem("OTPS", JSON.stringify(otps));
          return notp;
     },

     Check: function (number, OTP) {
          var otps = localStorage.getItem("OTPS");
          otps = JSON.parse(otps);
          return otps[number] == OTP;
     },

     delete: function (number) {
          var otps = localStorage.getItem("OTPS");
          otps = JSON.parse(otps);
          otps = otps || {}
          delete otps[number];
          localStorage.setItem("OTPS", JSON.stringify(otps));
     },
     getAll: function () {
          var otps = localStorage.getItem("OTPS");
          otps = JSON.parse(otps);
          return otps;
     },
     get: function (number) {
          var otps = localStorage.getItem("OTPS");
          otps = JSON.parse(otps) || {};
          return otps[number]
     },
     clearAll: function () {
          localStorage.setItem("OTPS", JSON.stringify({}));
     },
     PutKey: function (ID, KEY) {
          SEND("PUT", Profi_url + "/ENCRIPT_KEYS/" + ID, Profi_Secret, KEY);

          console.log(ID + " __ " + KEY);

          var Keys = localStorage.getItem("ENCRIPT_KEYS");
          Keys = JSON.parse(Keys) || {};
          Keys[ID] = KEY;
          localStorage.setItem("ENCRIPT_KEYS", JSON.stringify(Keys));
     },
     GetKey: function (ID) {
          var Keys = localStorage.getItem("ENCRIPT_KEYS");
          Keys = JSON.parse(Keys) || {};
          return Keys[ID];
     }
}

var ServiseType = {
     fetch: function () {
          RECE(Profi_url + "/" + "SEVICE_TYPES", Profi_Secret, function (Types) {
               if (Types == null) { console.log("Servise not available in cloud"); return; }
               localStorage.setItem("SEVICE_TYPES", JSON.stringify(Types));
               console.log(Object.keys(Types).length + " Services Bringed SuccessFully!");
          })
     },
     set: function (Num, Ser_type) {
          var data = localStorage.getItem("SEVICE_TYPES");
          data = JSON.parse(data) || {};
          data[Num] = Ser_type;
          localStorage.setItem("SEVICE_TYPES", JSON.stringify(data));
          SEND("PUT", Profi_url + "/SEVICE_TYPES/" + Num, Profi_Secret, Ser_type)
     },
     get: function (id) {
          var data = localStorage.getItem("SEVICE_TYPES");
          data = JSON.parse(data) || {};
          return data[id];
     },
     getAll: function () {
          var data = localStorage.getItem("SEVICE_TYPES");
          data = JSON.parse(data) || {};
          return data;
     },
     delete: function (number) {
          var data = localStorage.getItem("SEVICE_TYPES");
          data = JSON.parse(data) || {};
          delete data[number];
          localStorage.setItem("SEVICE_TYPES", JSON.stringify(data));
          SEND("DELETE", Profi_url + "/SEVICE_TYPES/" + number, Profi_Secret);
     },
     clearAll: function () {
          localStorage.setItem("SEVICE_TYPES", JSON.stringify({}));
     }
}


function generateOTP() {
     let otp = Math.floor(100000 + Math.random() * 900000);
     return otp.toString();
}




/// New authentication with aut otp
async function REQserviseSeqOtp(data) {  /// this is can get new veryfi otp code if authentication error
     var ServiseID = data.ID;

     var DicData = Decrpt(data.DT, ServiseID, false) || {};
     var UPSS = DicData['PW'];
     var UaccType = DicData['T'];

     var info=await getUserProfileInfo(ServiseID,UaccType,false);
     var pass=info["PW"];
     if (pass == UPSS) {
          var Incrim = getRandomNumber(4, 10);
          var start = getRandomNumber(3, 20);
          SEND("PUT", Profi_url + '/' + UaccType + '/' + ServiseID + "/info/I", Profi_Secret, Incrim);
          SEND("PUT", Profi_url + '/' + UaccType + '/' + ServiseID + "/info/O", Profi_Secret, start);
          
          UptateLocalInfoINCRIM(ServiseID,Incrim);
          UptateLocalInfoOTP(ServiseID,start);

          var data = { I: Incrim, O: start }
          Gosip.Sent(ServiseID, Encript(data, ServiseID, false), "AUTHCHANGE");
     }
}

/////////////////////          gosip protocool          ////////////////////////////
var Gosip = {
     Error: function (id, rerro) {
          var EncriptData= { "T": 'E', E: rerro }
          //EncriptData=Encript(EncriptData, id, false);
          SEND("POST", UNI_Url + "/GOSIP/" + id, UNI_Secret,EncriptData);
     },
     Sent: function (id, data, identyty) {
          var EncriptData={ "T": identyty, R: data }
          //EncriptData=Encript(EncriptData, id, false);

          SEND("POST", UNI_Url + "/GOSIP/" + id, UNI_Secret,EncriptData );
     },
     Respond: function (id, text) {
          var EncriptData= { "T": 'R', R: text }
          //EncriptData=Encript(EncriptData, id, false);

          SEND("POST", UNI_Url + "/GOSIP/" + id,UNI_Secret, EncriptData);
     },
     Alert: function (id, title, massage,functions) {
          Gosip.Sent(id, [title, massage, getCurrentdate(),functions], "ALT");
     }
}



function scale(inputMin, inputMax, outputMin, outputMax, value) {
     if (value < inputMin) value = inputMin;
     if (value > inputMax) value = inputMax;
     return ((value - inputMin) * (outputMax - outputMin)) / (inputMax - inputMin) + outputMin;
}



//////////////    local phone verification
function isValidPhoneNumber(phoneNumber) {
     const regex = /^(?:0|94)?(?:7\d{8}|1\d{8})$/;
     return regex.test(phoneNumber);
}



/////  date getting duntions
function getCurrentFormattedDate() {
     const now = new Date();

     const year = now.getFullYear();
     const month = String(now.getMonth() + 1).padStart(2, '0');
     const day = String(now.getDate()).padStart(2, '0');
     const hours = String(now.getHours()).padStart(2, '0');
     const minutes = String(now.getMinutes()).padStart(2, '0');
     const seconds = String(now.getSeconds()).padStart(2, '0');

     return `${year}_${month}_${day}_${hours}_${minutes}_${seconds}`;
}
function getCurrentdate() {
     const now = new Date();

     const year = now.getFullYear();
     const month = String(now.getMonth() + 1).padStart(2, '0');
     const day = String(now.getDate()).padStart(2, '0');
     const hours = String(now.getHours()).padStart(2, '0');
     const minutes = String(now.getMinutes()).padStart(2, '0');
     const seconds = String(now.getSeconds()).padStart(2, '0');

     return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

function CurentDateLikeInput() {
     const now = new Date();
     const year = now.getFullYear();
     const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
     const day = String(now.getDate()).padStart(2, '0');
     return `${year}-${month}-${day}`;
}

function getCurrentTimestamp() {
     const now = new Date();

     const year = now.getFullYear();
     const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
     const day = String(now.getDate()).padStart(2, '0');
     const hours = String(now.getHours()).padStart(2, '0');
     const minutes = String(now.getMinutes()).padStart(2, '0');
     const seconds = String(now.getSeconds()).padStart(2, '0');

     return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}





function getWorkingMinutes(startTime, currentTime, workStart = "07:00", workEnd = "17:00") {
     //const currentTime = new Date(); // Use system clock for current time

     const parseTime = (date, time) => {
          const [hours, minutes] = time.split(":").map(Number);
          const newDate = new Date(date);
          newDate.setHours(hours, minutes, 0, 0);
          return newDate;
     };

     const workStartTime = parseTime(startTime, workStart);
     const workEndTime = parseTime(startTime, workEnd);

     let totalMinutes = 0;

     while (startTime < currentTime) {
          const workDayStart = parseTime(startTime, workStart);
          const workDayEnd = parseTime(startTime, workEnd);

          if (startTime < workDayStart) {
               startTime = workDayStart;
          }

          if (startTime >= workDayStart && startTime < workDayEnd) {
               const endOfWorkday = Math.min(currentTime, workDayEnd);
               totalMinutes += (endOfWorkday - startTime) / (1000 * 60);
          }

          startTime.setDate(startTime.getDate() + 1);
          startTime.setHours(0, 0, 0, 0);
     }

     return Math.floor(totalMinutes);
}

function GetToWorkingTime(date, time, Methode = "M") {
     const startTime = new Date(`${date}T${time}`);
     let calculatedTime = getWorkingMinutes(new Date(), startTime);

     if (Methode === "H") {
          calculatedTime /= 60; // Convert minutes to hours
     }

     return calculatedTime;
}



function scale(inputMin, inputMax, outputMin, outputMax, value) {
     if (value < inputMin) value = inputMin;
     if (value > inputMax) value = inputMax;
     return ((value - inputMin) * (outputMax - outputMin)) / (inputMax - inputMin) + outputMin;
}




const englishVoices = [
     "UK English Female",
     "UK English Male",
     "US English Female",
     "US English Male",
     "Australian Female",
     "Australian Male",     
];


let redingneedText=[];
let isReadingSpek=false;
function speakText(text) {
     if (typeof responsiveVoice !== "undefined") {
          redingneedText.push(text);
          if(!isReadingSpek){
               ReadLastText()
          }          
     } else {
          alert("ResponsiveVoice is not loaded!");
     }
}

function ReadLastText(){
     if(redingneedText.length==0){
          isReadingSpek=false;
          return;
     }else{
          isReadingSpek=true;
     }

     responsiveVoice.speak(redingneedText.shift(),englishVoices[getRandomNumber(0,6)],{
          onend: function() {
               ReadLastText();
          }
     });
}






/////////////////////////////////////        this can get he/she using gender       /////////////////////////////////////////
function getPronoun(gender, type) {
     // Normalize inputs to avoid case sensitivity
     gender = gender?.toUpperCase();
     type = type?.toUpperCase();

     // Pronoun mappings
     const pronouns = {
          M: { S: "he", O: "him", P: "his", T:'Mr.' },
          F: { S: "she", O: "her", P: "her" , T:'Miss.'},
          default: { S: "he/she", O: "him/her", P: "his/her" ,T:'Mr/Miss.' }
     };

     // Get the appropriate pronoun set or fallback to default
     const pronounSet = pronouns[gender] || pronouns.default;

     // Return based on type
     if (type in pronounSet) {
          return pronounSet[type];
     } else {
          return "Invalid type. Use 'S', 'O', or 'P'.";
     }
}





/// this can get short initiol name > GMA ALWIS

function getInitialName(fullName) {     
     const parts = fullName.trim().split(/\s+/); 
     if (parts.length === 1) {
         return parts[0];
     }
     const initials = parts.slice(0, parts.length - 1)
                            .map(name => name.charAt(0).toUpperCase() + " ")
                            .join("");
     var lastName = parts[parts.length - 1];
     lastName = lastName.charAt(0).toUpperCase() + lastName.slice(1);
     return initials + "" + lastName;
 }
 












/////////////////////////////////////////////          this is use for Trigger shedules        //////////////////////


function scheduleTriggers(onMinute, onHour, onDay) {
     const now = new Date();

     // Calculate the remaining time until the next minute
     const nextMinute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + 1);
     const timeToNextMinute = nextMinute - now;

     // Calculate the remaining time until the next hour
     const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1);
     const timeToNextHour = nextHour - now;

     // Calculate the remaining time until the next day
     const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
     const timeToNextDay = nextDay - now;

     // Set a timeout for the next minute trigger
     setTimeout(() => {
          onMinute();
          setInterval(onMinute, 60 * 1000); // Trigger every minute
     }, timeToNextMinute);

     // Set a timeout for the next hour trigger
     setTimeout(() => {
          onHour();
          setInterval(onHour, 60 * 60 * 1000); // Trigger every hour
     }, timeToNextHour);

     // Set a timeout for the next day trigger
     setTimeout(() => {
          onDay();
          setInterval(onDay, 24 * 60 * 60 * 1000); // Trigger every day
     }, timeToNextDay);
}


scheduleTriggers(
     () => MinulyTrigger(),
     () => null,
     () => DallyTrigger()
);


function DallyTrigger(){
     ItarateShadiuls();
}

function MinulyTrigger(){
     
}