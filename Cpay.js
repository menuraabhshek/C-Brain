
function ReceveCpaysRequsts(data) {
     var obj = data;
     var rawUSeVeryfi = ["FI_HO"].includes(obj["M"]);

     obj["IS"] = obj["IS"] || false;
     var isServise = obj["IS"] == true;
     if (!isServise) {
          VeryfiUser(obj["X"], obj['PW'], obj['O'], rawUSeVeryfi, function (verifide) {
               AfterVeryfiCpayProcess(obj, verifide);
          });
     } else {
          CheckServiceProvider('HT', obj["X"], obj["O"], obj["PW"], function (veryfied) {
               AfterVeryfiCpayProcess(obj, veryfied);
          })
     }

}

async function AfterVeryfiCpayProcess(obj, verifide) {
     if (verifide) {
          if (obj["M"] == "PAY") {
               obj["ID"] = obj["I"] ? obj["ID"] : Get_ROM_ID(obj["ID"]);
               if (obj["ID"] == '') {
                    Gosip.Sent(obj["X"], '', "NID");
                    return;
               }
               CpayTracefer(obj["X"], obj["ID"], obj["A"], obj["R"]);
          } else if (obj["M"] == "HIS") {
               SentCpayHistory(obj["X"]);
          }
     }
}

function CpayDirectTopUp(id,amount){
     CpayTopup(id, amount, "TOP UP")
}

function CpayTopup(ID, Amount, Remark) {
     PaymentProsess.Add("P",'',ID,Amount,Remark,"C");
}
async function CpayDeTopup(ID, Amount, Remark,callback) {
     var CpayBal=await GetCpayPrice(ID);

     Amount=parseInt(Amount);
     
     if (CpayBal >= Amount) {                            
          PaymentProsess.Add("P",ID,"",Amount,Remark,"D");
          if(callback){callback(true)}  
     } else {
          if(callback){callback("NBAL")}          
     }

}
async function CpayTracefer(Sender, Recever, Amount, Remarker,callback) {     
     if (Sender== Recever) {
          Gosip.Sent(Sender, '', "SCPAY");
          return;
     } else if (Get_ROM_Number(Recever) == null) {
          Gosip.Sent(Sender, '', "NID");
          return;
     }
     Amount=parseInt(Amount)||0;

     var CpayBal=await GetCpayPrice(Sender);
     if (CpayBal >= Amount) {
          Remarker=`${Remarker||"REC"}`                 
          PaymentProsess.Add("T",Sender,Recever,Amount,Remarker);
          Gosip.Sent(Sender, { B: CpayBal-Amount }, "PAID");  
          if(callback){
               callback("OK")
          }
     } else {
          Gosip.Sent(Sender, '', "NBAL");
          if(callback){
               callback("NBAL")
          }
     }
}

function SendCancelationFee(ID) {
     CpayTopup(ID, RefudAmmount, "CANCELATION FEE");
}





var CashStoreCpayBalance={}
async function GetCpayPrice(Id, callback = null) {
     if(CashStoreCpayBalance[Id]!=null){
          var price=parseInt(CashStoreCpayBalance[Id]);
          if (callback) {
               callback(price); // If callback exists, use it
          }
          return price
     }

     return new Promise((resolve) => {
          RECE(Profi_url + '/Cpay/' + Id + "/RS", Profi_Secret, function (price) {
               let finalPrice =parseInt( (price || 0));

               if (callback) {
                    callback(finalPrice); // If callback exists, use it
               }
               CashStoreCpayBalance[Id]=finalPrice;
               console.log("Amount FromCloud");

               resolve(finalPrice); // Always resolve the promise
          });
     });
}



function SentCpayHistory(ID) {     // this was senting cpay transetraction or other payment histpry to user
     RECE(Profi_url + '/Cpay/' + ID + "/H", Profi_Secret, function (History) {
          History = History || {};

          let historyArray = Object.values(History);

          historyArray.sort(function (a, b) {
               return new Date(b.T) - new Date(a.T);  // Sort in descending order of date
          });

          if (historyArray.length > 30) {
               historyArray = historyArray.slice(0, 30);
          }
          Gosip.Sent(ID, historyArray, "HIS");
     });
}














///////////////////////////////////////////////////////      morden Cpay apynebt      /////////////////////////////////////////






var PaymentProsess = {
     IsProcessing: false,
     ProcesStartTime:0,
     ProcessEndTime:0,
     Add: function (METHODE, FROM_ID, TO_ID, AMOUNT, REMARK,TYPE) {   // Method Can be >> || 'T' - Transeder || 'P' - Payment ||  >> Type Only using for payment tel debedit or credit
          var ProcessingQ = localStorage.getItem(`PAYMENT_PROCEING_${METHODE}`) || "[]";
          ProcessingQ = JSON.parse(ProcessingQ);

          var QData = {
               METHODE: METHODE,
               FROM_ID: FROM_ID,
               TO_ID: TO_ID,
               AMOUNT: Math.abs(AMOUNT),
               REMARK: REMARK,
               STATE: "NEW",
               TYPE:TYPE,
          }
          ProcessingQ.push(QData);
          localStorage.setItem(`PAYMENT_PROCEING_${METHODE}`, JSON.stringify(ProcessingQ));

          if(PaymentProsess.IsProcessing==false){
               PaymentProsess.IsProcessing==true;
               PaymentProsess.UpdateNewCurenProcess();
          }
     },
     Get: function (METHODE, INDEX) {
          var ProcessingQ = localStorage.getItem(`PAYMENT_PROCEING_${METHODE}`) || "[]";
          ProcessingQ = JSON.parse(ProcessingQ);
          return ProcessingQ[INDEX];
     },
     Remove: function (METHODE, INDEX) {
          var ProcessingQ = localStorage.getItem(`PAYMENT_PROCEING_${METHODE}`) || "[]";
          ProcessingQ = JSON.parse(ProcessingQ);
          var Data = ProcessingQ[INDEX]
          if (INDEX >= 0 && INDEX < ProcessingQ.length) {
               ProcessingQ.splice(INDEX, 1);
          }
          localStorage.setItem(`PAYMENT_PROCEING_${METHODE}`, JSON.stringify(ProcessingQ));
          return Data;
     },
     GetAll: function (METHODE) {
          var ProcessingQ = localStorage.getItem(`PAYMENT_PROCEING_${METHODE}`) || "[]";
          return JSON.parse(ProcessingQ);
     },
     UpdateNewCurenProcess: function () {
          PaymentProsess.ProcesStartTime=performance.now();
          var TranceferProcessQ = PaymentProsess.GetAll("T");
          var PaymentProsessQ = PaymentProsess.GetAll("P");

          var CuretProcess;
          PaymentProsess.IsProcessing = true;
          if (TranceferProcessQ.length == 0) {
               if (PaymentProsessQ.length == 0) {
                    PaymentProsess.IsProcessing = false;
                    PaymentProsess.CurentProcess.Set({});                    
                    return;
               } else {
                    CuretProcess = PaymentProsess.Remove("P", 0);
               }
          } else {
               CuretProcess = PaymentProsess.Remove("T", 0);
          }
          PaymentProsess.CurentProcess.Set(CuretProcess);
          PaymentProsess.ProcessSelect();
     },
     CurentProcess: {
          Sate: {
               Get: function () {
                    var CurentProcess = localStorage.getItem(`CRENT_PAYMENT_PROCEING`) || "{}";
                    CurentProcess = JSON.parse(CurentProcess);
                    return CurentProcess["STATE"];
               },
               Set: function (STATE) {
                    var CurentProcess = localStorage.getItem(`CRENT_PAYMENT_PROCEING`) || "{}";
                    CurentProcess = JSON.parse(CurentProcess);
                    CurentProcess["STATE"] = STATE;
                    localStorage.setItem(`CRENT_PAYMENT_PROCEING`, JSON.stringify(CurentProcess))
               }
          },
          Methode: function () {
               var CurentProcess = localStorage.getItem(`CRENT_PAYMENT_PROCEING`) || "{}";
               CurentProcess = JSON.parse(CurentProcess);
               return CurentProcess["METHODE"];
          },
          Get: function () {
               var CurentProcess = localStorage.getItem(`CRENT_PAYMENT_PROCEING`) || "{}";
               CurentProcess = JSON.parse(CurentProcess);
               return CurentProcess;
          },
          Set(PROCESSINGDATA) {
               localStorage.setItem(`CRENT_PAYMENT_PROCEING`, JSON.stringify(PROCESSINGDATA))
          },
          Balance: {
               Set: function (METHOD, NEWBALANCE) {
                    var CurentProcess = localStorage.getItem(`CRENT_PAYMENT_PROCEING`) || "{}";
                    CurentProcess = JSON.parse(CurentProcess);
                    CurentProcess[METHOD] = NEWBALANCE;
                    localStorage.setItem(`CRENT_PAYMENT_PROCEING`, JSON.stringify(CurentProcess));
               },
               Get: function (METHOD) {
                    var CurentProcess = localStorage.getItem(`CRENT_PAYMENT_PROCEING`) || "{}";
                    CurentProcess = JSON.parse(CurentProcess);
                    return CurentProcess[METHOD];
               }
          }
     },
     ProcessSelect: function () {
          var CurentMethode = PaymentProsess.CurentProcess.Methode();

          if (CurentMethode == "P") {
               PaymentProsess.Process.Payment();
          } else if (CurentMethode == "T") {
               PaymentProsess.Process.Transfer();
          }
     },
     Process: {
          Payment: function () {
               var CurentSate = PaymentProsess.CurentProcess.Sate.Get();
               var TransferData = PaymentProsess.CurentProcess.Get();

               if (CurentSate == "NEW") {
                    if(TransferData["TYPE"]=="D"){   // this mean debit frome account
                         CpayTrancefer.Debit(TransferData["FROM_ID"], TransferData["AMOUNT"],TransferData["REMARK"]);
                    }else if(TransferData["TYPE"]=="C"){  // this mean credit to account
                         CpayTrancefer.Credit(TransferData["TO_ID"], TransferData["AMOUNT"],TransferData["REMARK"]);
                    }                    
               } else if (CurentSate == "SEND") {
                    AddCpayHistory(TransferData["FROM_ID"], `-${TransferData["AMOUNT"]}`,"_SYSTEM", TransferData["REMARK"], TransferData["F"]);
                    SentCpaySMS("DTU",TransferData["FROM_ID"], '', TransferData["AMOUNT"], TransferData["F"], TransferData["REMARK"]);
               
                    PaymentProsess.ProcessEndTime=performance.now();
                    console.log(`Rs ${TransferData["AMOUNT"]}.00 Debited  From ${TransferData["FROM_ID"]} For ${TransferData["REMARK"]} __  -->> Time : ${LAstPaymentProcessintgTime()} ms`);
                    PaymentProsess.UpdateNewCurenProcess();
               }else if (CurentSate == "HIS") {
                    AddCpayHistory(TransferData["TO_ID"], `${TransferData["AMOUNT"]}`,"_SYSTEM", TransferData["REMARK"], TransferData["T"]);
                    SentCpaySMS("TU",TransferData["TO_ID"],'',TransferData["AMOUNT"], TransferData["T"], TransferData["REMARK"]);
               
                    PaymentProsess.ProcessEndTime=performance.now();
                    console.log(`Rs ${TransferData["AMOUNT"]}.00 Credited  To ${TransferData["TO_ID"]} For ${TransferData["REMARK"]}  __  -->> Time : ${LAstPaymentProcessintgTime()} ms`);
                    PaymentProsess.UpdateNewCurenProcess();
               }

          },
          Transfer: function () {
               var CurentSate = PaymentProsess.CurentProcess.Sate.Get();
               var TransferData = PaymentProsess.CurentProcess.Get();

               if (CurentSate == "NEW") {
                    CpayTrancefer.Debit(TransferData["FROM_ID"], TransferData["AMOUNT"],TransferData["REMARK"]);
               
               } else if (CurentSate == "SEND") {
                    CpayTrancefer.Credit(TransferData["TO_ID"], TransferData["AMOUNT"],TransferData["REMARK"])
               } else if (CurentSate == "HIS") {
                    AddCpayHistory(TransferData["FROM_ID"], `-${TransferData["AMOUNT"]}`, TransferData["TO_ID"], TransferData["REMARK"], TransferData["F"]);
                    AddCpayHistory(TransferData["TO_ID"], TransferData["AMOUNT"], TransferData["FROM_ID"], TransferData["REMARK"], TransferData["T"]);

                    SentCpaySMS("TDE",TransferData["FROM_ID"], TransferData["TO_ID"], TransferData["AMOUNT"], TransferData["F"], TransferData["REMARK"]);
                    SentCpaySMS("TCR",TransferData["TO_ID"], TransferData["FROM_ID"], TransferData["AMOUNT"], TransferData["T"], TransferData["REMARK"])
                    
                    AddTransferToSheet(TransferData["AMOUNT"], TransferData["FROM_ID"], TransferData["TO_ID"],TransferData["REMARK"])

                    PaymentProsess.ProcessEndTime=performance.now();
                    console.log(`Rs ${TransferData["AMOUNT"]}.00 Transfer from ${TransferData["FROM_ID"]} to ${TransferData["TO_ID"]} __  -->> Time : ${LAstPaymentProcessintgTime()} ms`);
                    PaymentProsess.UpdateNewCurenProcess();
               }

          }
     }
}

var PementStackCount=0;
var PrevePaymentProcess={};

setInterval(function(){
     if(PaymentProsess.IsProcessing){
          if(deepEqualOBJ(PrevePaymentProcess, PaymentProsess.CurentProcess.Get())){
               PementStackCount++;
          }else{
               PementStackCount=0;
          }
          if(PementStackCount>3){
               console.log("Payment Stack Error Found And Remove it And Satrting New One !");
               PementStackCount=0;
               PaymentProsess.UpdateNewCurenProcess();
          }
          PrevePaymentProcess=PaymentProsess.CurentProcess.Get();
     }
},3000)

function deepEqualOBJ(obj1, obj2) {
     return JSON.stringify(obj1, Object.keys(obj1).sort()) === JSON.stringify(obj2, Object.keys(obj2).sort());
 }

function LAstPaymentProcessintgTime(){
    return (PaymentProsess.ProcessEndTime - PaymentProsess.ProcesStartTime).toFixed(2)
}

/*
var QData = {
     METHODE: METHODE,
     FROM_ID: FROM_ID,
     TO_ID: TO_ID,
     AMOUNT: AMOUNT,
     REMARK: REMARK,
     STATE: "NEW",
}
*/

var CpayTrancefer = {
     Debit: async function (CPAY_ID, AMOUNT,REMARK) {                // ----->  this is a first step of the trancefer 
          var CurentAmount = await GetCpayPrice(CPAY_ID);
          if (CurentAmount >= AMOUNT) {
               var NewBalance = CurentAmount - AMOUNT;
               UpdateCpayBalance(CPAY_ID, NewBalance, function () {                    
                    PaymentProsess.CurentProcess.Balance.Set("F", NewBalance);
                    PaymentProsess.CurentProcess.Sate.Set("SEND");
                    PaymentProsess.ProcessSelect();
               })
          } else {
               console.log("no balance");
               PaymentProsess.UpdateNewCurenProcess();
          }
          if(ServiceOnlineMinimumCpayAmount>NewBalance){
               GoHotelserviceOff(CPAY_ID,"NO_BAL");
          }
          if(NewBalance<200){
               setTimeout(function(){
                    Gosip.Sent(CPAY_ID, { B: NewBalance }, "LOWFUN");
               },10000);
               
          }
          Gosip.Sent(CPAY_ID, { B: NewBalance }, "FUNDSENT");
          SelectAndSendLogType(CPAY_ID, AMOUNT,REMARK)
     },
     Credit: async function (CPAY_ID, AMOUNT,REMARK) {               // ----->  this is a Second step of the trancefer 
          var CurentAmount = await GetCpayPrice(CPAY_ID);
          var NewBalance = CurentAmount + AMOUNT;
          UpdateCpayBalance(CPAY_ID, NewBalance, function () {              
               PaymentProsess.CurentProcess.Balance.Set("T", NewBalance);
               PaymentProsess.CurentProcess.Sate.Set("HIS");
               PaymentProsess.ProcessSelect();
               Gosip.Sent(CPAY_ID, { B: NewBalance }, "FUNDRECE");
          });
          SelectAndSendLogType(CPAY_ID, AMOUNT,REMARK)
     }
}





function UpdateCpayBalance(CPAY_ID, AMOUNT, CALLBACK) {
     SEND("PUT", Profi_url + '/Cpay/' + CPAY_ID + "/RS", Profi_Secret, AMOUNT, function () {
          CashStoreCpayBalance[CPAY_ID]=AMOUNT;
          if (CALLBACK) {
               CALLBACK()
          }
          AddPointsToServis(CPAY_ID,5);
     });
}



function SentCpaySMS(METH, SMS_RECEVER, ENDUSER, AMOUNT, BALANCE, REMARK) {
     if(AMOUNT<110){
          return
     }

     var Time = getCurrentdate();
     var massage = '';
     if (METH == "TU") {
          massage = `Credited!\n\nAmount: Rs +${AMOUNT}.00\nBalance:Rs ${BALANCE}.00\nTime:${Time}\nRemark:${REMARK}`;
     } else if (METH == "TDE") {
          massage = `Cpay Debited!\n\nTo:${ENDUSER} (${Get_ROM_Number(ENDUSER)})\nAmount: Rs -${AMOUNT}.00\nBalance:Rs ${BALANCE}.00\nTime:${Time}\nRemark:${REMARK}`;
     } else if (METH == "TCR") {
          massage = `Cpay Credited!\n\nFrom:${ENDUSER} (${Get_ROM_Number(ENDUSER)})\nAmount: Rs +${AMOUNT}.00\nBalance:Rs ${BALANCE}.00\nTime:${Time}\nRemark:${REMARK}`;
     } else if (METH == "DTU") {
          massage = `Debited!\n\nAmount: Rs -${AMOUNT}.00\nBalance: RS ${BALANCE}.00\nReason: ${REMARK}`;
     }
     SendSMS(SMS_RECEVER, massage);
}

function AddCpayHistory(CPAY_ID, AMOUNT, END_USER, REMARK, BALANCE) {
     var Time = getCurrentdate();
     var Singn = String(AMOUNT);
     if (Singn[0] == '-' || Singn[0] == '+') {
          Singn = ''
     } else {
          Singn = '+'
     }

     var HistoryObject = {
          A: `${Singn}${AMOUNT}`,
          T: Time,
          RE: END_USER == "_SYSTEM" ? "SYSTEM" : `${END_USER} (${Get_ROM_Number(END_USER)})`,
          R: REMARK,
          B: BALANCE
     }
     SEND("POST", Profi_url + '/Cpay/' + CPAY_ID + "/H", Profi_Secret, HistoryObject);
}


function Topay(METHODE, FROM_ID, TO_ID, AMOUNT, REMARK) {

}












































function ProcessWalletBalenseReqests(data){  
     var selectedREQ = data;
     var UID = selectedREQ.ID;
     var CODE = Decrpt(selectedREQ.DT, selectedREQ.ID, false) || '';

     if (CODE == "ACCOK") {
          GetCpayPrice(UID, function(RS){
               Gosip.Sent(UID, RS, "WALLET_BAL");
          })
     }
    
}


