//////////////////////////////////////////  Pricing Variables  ////////////////////////////////////////////////////////////////////
var ServiceWelcoemPoints=55;
var ServiceOnlineMinimumCpayAmount=100;

var ThankPayment={
     TX:20,
     HT:100,
}

var JobQute={
     PE:50,
     ST:100,
     BO:200,
     CL:500,
     MO:1000
}
var JobQutePrice={
     PE:15,
     ST:10,
     BO:9,
     CL:8,
     MO:6
}
var JobQuteName={
     PE:"PEBBLE",
     ST:"STONE",
     BO:"BOULDER",
     CL:"CLIFF",
     MO:"MOUNTAIN"
}
var JobPriceRating={
     TX:2,
     HT:1,
}

var FreeQuta={
     TX:20,
     HT:10,
}

//////////////////////////////////////////  Login & regist for Service ACC Haddleing  ////////////////////////////////////////////////////////////////////
function DecotdServAccReq(obj){
     if(obj["T"]=="REG"){
          SER_REG(obj);
     }else if(obj["T"]=="LOG"){
          SER_LOG(obj);
     }    
}







/////////////////////////////////////////////////////        Service Acc Handleing Funtions          /////////////////////////////////

function SER_REG(data){
     if(Get_ROM_ID(data["N"])==null){
          data["P"]=Decrpt(data["P"],data["N"],true);
          if(data["P"]==null){               
               return;
          }

          data["O"]=Decrpt(data["O"],data["N"],true);
          if(data["O"]==null){               
               return;
          }

          if(!ChekAllKeysIsAvaillable(Object.keys(data),["T","O","P","N","ST"])){SEND("POST",UNI_Url+"/GOSIP/"+data["N"],"",{"T":'E',E:"Data Mising Ditected!"}); return}
          if(!OTP.Check(data["N"],data["O"])){SEND("POST",UNI_Url+"/GOSIP/"+data["N"],"",{"T":'E',E:"OTP is Incorrect!"}); return}



          RECE(Profi_url+"/"+"LAST_USER",Profi_Secret,function(LastUID){               
               LastUID=Cloud_To_desimal(String(LastUID))+1
               var CID=GetCloudID(LastUID)
               var Incrim=getRandomNumber(4,10);
               var start=getRandomNumber(3,20);

               var newrOBJ={
                    X:CID,
                    P:data["N"],
                    PW:data["P"],
                    O:start,
                    I:Incrim,
                    ST:data["ST"],
                    RD:getCurrentdate()                         
               }                    
               SEND("PUT",Profi_url+'/Service/'+CID+"/info",Profi_Secret,newrOBJ,function(profilputdata){                    
                    if(profilputdata["P"]==data["N"]){
                         SEND("PUT",Profi_url+"/"+"LAST_USER",Profi_Secret,CID,function(a){                              
                              if(a==CID){
                                   var AckObj={"T":'OK',ST:data["ST"],X:CID,O:start,I:Incrim};
                                   SEND("POST",UNI_Url+'/GOSIP/'+data["N"],"",Encript(AckObj,data["N"],true),function(){                                                                            
                                        NewRom(CID,String(data["N"]));                                        
                                        OTP.PutKey(CID,OTP.get(data["N"]));                                                                                
                                        SendSystermLog(data["ST"],`${CID} Registered`)
                                        ServiseType.set(CID,data["ST"]);
                                        OTP.delete(String(data["N"]))
                                        setTimeout(function(){
                                             //Gosip.Alert(CID,"WELCOME TO CSPP🙏",`Welcome to the Ceylonian Service Provider Portal (CSPP)! Please complete your profile, service information, and all other required details. Once you have submitted everything, we will promptly activate your account(A our agent may contact you for further verification)❤`);
                                             TestingPeriodeRegistorProced(CID,"WEL");  // උඩ ගොස්සිප් එක වෙනුවට තව කාලික ටෙස්ට් එකට මේක පාවිච්චි කරනව වෙල්කම් එකට
                                        },10000);
                                        Atant(`Hey there! , New service provider was registered`);
                                   })
                              }else{
                                   SEND("POST",UNI_Url+"/GOSIP/"+data["N"],"",{"T":'E',E:"Internal server error.try again!"});
                              }
                         })
                    }else{
                         SEND("POST",UNI_Url+"/GOSIP/"+data["N"],"",{"T":'E',E:"Internal server error.try again!"});
                    }                         
               });
          })               
     }else{               
          SEND("POST",UNI_Url+"/GOSIP/"+data["N"],"",{"T":'E',E:"This phone number is already in use"});         
     }
}





function SER_LOG(data){   
     var UID=Get_ROM_ID(data["N"]);
    
     data["P"]=Decrpt(data["P"],data["N"],true);
     if(data["P"]==null){         
          return;
     }

     data["O"]=Decrpt(data["O"],data["N"],true);
     if(data["O"]==null){         
          return;
     }

     if(!ChekAllKeysIsAvaillable(Object.keys(data),["T","O","P","N"])){SEND("POST",UNI_Url+"/GOSIP/"+data["N"],"",{"T":'E',E:"Data Mising Ditected!"}); return}
     if(!OTP.Check(data["N"],data["O"])){SEND("POST",UNI_Url+"/GOSIP/"+data["N"],"",{"T":'E',E:"OTP is Incorrect!"}); return}

     RECE(Profi_url+"/Service/"+UID+"/info",Profi_Secret,function(info){
         
          if(info!=null){
               var useEnter=data["P"]; 
               var cloudpass=info["PW"];
               

               if(useEnter==cloudpass){
                    var Incrim=getRandomNumber(4,10);
                    var start=getRandomNumber(3,20);

                    info["O"]=start;
                    info["I"]=Incrim;


                    SEND("PUT",Profi_url+'/Service/'+UID+"/info",Profi_Secret,info,function(profilputdata){
                         if(profilputdata["X"]==info["X"]){
                              var AckObj={"T":'OK',ST:profilputdata["ST"],X:UID,O:start,I:Incrim};
                              SEND("POST",UNI_Url+'/GOSIP/'+data["N"],"",Encript(AckObj,data["N"],true),function(){
                                   OTP.PutKey(UID,OTP.get(data["N"])); 
                                   OTP.delete(String(data["N"]));                                                                                                
                              })
                         }
                    })
               }else{
                    SEND("POST",UNI_Url+"/GOSIP/"+data["N"],"",{"T":'E',E:"Incorrect Password!"});                   
               }
          }else{
               SEND("POST",UNI_Url+"/GOSIP/"+data["N"],"",{"T":'E',E:"Wrong number. please Check again!"});              
          }
     })
}

/////////////////////////////////////////////////////        Service Type Register          /////////////////////////////////







/////////////////////////////////////////////////////        Service Provider VeryFi          /////////////////////////////////

async function CheckServiceProvider(serviceType,UID,OTP,Password,callBack,alwaseTrue){
     var Chekker=true;
    // if(!ServiseType.get(Get_ROM_Number(UID))==serviceType){Chekker=false; Gosip.Error(UID,"The server threw your request because your service type does not match the service registry!"); }
     
    var info=await getUserProfileInfo(UID,"Service",false)

    var decriptpass=Decrpt(Password,UID,false);
     var decriptOtp=Decrpt(OTP,UID,false);
     
     if(info && "BAN" in info && info['BAN']!=''){
          Gosip.Sent(UID,info['BAN'],"BAN");
          if(callBack!=null){
               callBack(false);
          }
          return;  
     }
     
     if(alwaseTrue){
          if(callBack!=null){
               callBack(info['PW']==decriptpass,info);
          }
          return;  
     }    
     
     if(info['O']==decriptOtp && info['PW']==decriptpass){
          Chekker=true;
          var NewOTP=parseInt(info['O'])+parseInt(info['I'])
          SEND("PUT",Profi_url+"/Service/"+UID+"/info/O",Profi_Secret,NewOTP);
          UptateLocalInfoOTP(UID,NewOTP)
     }else{
          Gosip.Error(UID,"Authentication faileddd!");
          Chekker=false;
     }
     if(callBack!=null){
          callBack(Chekker,info);
     }  


}


var UserProfileInfo={}
async function getUserProfileInfo(ID,METHOD,ALWASCLOUD){
     if(UserProfileInfo[ID]!=null && !ALWASCLOUD){
          return UserProfileInfo[ID];
     }     
     return new Promise((resolve) => {
          RECE(Profi_url+`/${METHOD}/`+ID+"/info",Profi_Secret,function(info){
               UserProfileInfo[ID]=info;
               resolve(info);
          })
     });
}
function UptateLocalInfoOTP(ID,OTP){
     UptateLocalInfo_CoustomKey(ID,"O",OTP)
}

function UptateLocalInfoINCRIM(ID,INCRIMERTER){
     UptateLocalInfo_CoustomKey(ID,"I",INCRIMERTER)
}
 
async function UptateLocalInfo_CoustomKey(ID,KEY,VAL){
     var Data=UserProfileInfo[ID];

     if(Data){
          Data[KEY]=VAL;
     }else{
          let method=ServiseType.get(ID)==null?"ACC":"Service"
          let profileinfo= await getUserProfileInfo(ID,method,true);
          console.log(profileinfo)
          profileinfo[KEY]=VAL;
          console.log(profileinfo[KEY])
     }

     
}


/////////////////////////////////////////////////////        Adding Quata Funiton          /////////////////////////////////
function AddQuata(id,quata){
     var Price=(JobQute[quata]*JobQutePrice[quata])/JobPriceRating[ServiseType.get(id)];
     

     if(Price>0){
          CpayDeTopup(id,Price,`FOR ${JobQuteName[quata]} QUOTA`,function(Retun){              
               if(Retun==true){
                    GetQata(id,function(curentQuta){    
                         const NewQuta=curentQuta+JobQute[quata]               
                         UpdateQutaAcc(id,NewQuta);
                         Gosip.Sent(id,{ST:'OK',QT:GetMonthCode()+'_'+(curentQuta+JobQute[quata])},"QUTA");
                         AddPointsToServis(id,0.6*NewQuta);
                    });  
               }else if(Retun=="NBAL"){
                    Gosip.Sent(id,{ST:'NBL'},"QUTA");
               }

          });
     }else{
          Gosip.Sent(id,{ST:'ER'},"QUTA");
     }
}

function DecreeseQuata(id){
     GetQata(id,function(quta){
          quta-=1;
          UpdateQutaAcc(id,quta);

          if(quta<=0){
               GoHotelserviceOff(id,"QT_EN");
          }
          AddPointsToServis(id,5);
     });
}

function GoHotelserviceOff(id,Sent){
     if(ServiseType.get(id)=="HT"){
          if(!OnlineServises.parseData("HT","1E")){return}

          OnlineServises.Remove("HT",id);
          Gosip.Sent(id,{ST:'D',RE:Sent},"FOCE_ONLN");
     }
}


async function GetQata(id,calback){
     var ProfileInfo=await getUserProfileInfo(id,"Service");
     console.log("profieinfo",ProfileInfo,id);

     var Quata=ProfileInfo.QT;

     
     var ReturnQuta=FreeQuta[ServiseType.get(id)];
     Quata=Quata||''
     var lastQutaMont=Quata.split("_")[0]

     return new Promise((resolve) => {
          if(Quata==''){
               UpdateQutaAcc(id,ReturnQuta,function(){                    
                    if(calback){
                         calback(parseInt(ReturnQuta))
                    }
                    resolve(parseInt(ReturnQuta))
               });             
          }else if(lastQutaMont!=GetMonthCode()){
               UpdateQutaAcc(id,ReturnQuta,function(){                   
                    if(calback){
                         calback(parseInt(ReturnQuta))
                    }
                    resolve(parseInt(ReturnQuta))
               });
          }else{
               ReturnQuta=Quata.split("_")[1];
               if(calback){
                    calback(parseInt(ReturnQuta))
               }
               resolve(parseInt(ReturnQuta))
          }
     });
     
     
   //  RECE(Profi_url+"/Service/"+id+"/info/QT",Profi_Secret,async function(Quata){  

    // })    
}

function UpdateQutaAcc(id,quata,callBack){
     var QT=`${GetMonthCode()}_${quata}`
     UptateLocalInfo_CoustomKey(id,"QT",QT);
     SEND("PUT",Profi_url+"/Service/"+id+"/info/QT",Profi_Secret,QT,function(){
          if(callBack){
               callBack()
          }
     });
}




let onlineServiceRegistry={}
var OnlineServises={ 
     Add:function(ST,SID,data){
          RECE(Profi_url+"/Service/"+SID+"/info/AT",Profi_Secret,function(Activation){               
               if(Activation){
                    var CurentServise=localStorage.getItem("ONLINE_"+ST);
                    CurentServise=JSON.parse(CurentServise)||{};
                    GetQata(SID,async function(quta) {                         
                         if(quta<1){Gosip.Sent(SID,{'E':`Job Quota ended!`,ST:'D'},"ONLINE_STET"); return}

                         var CpayBalnce= await GetCpayPrice(SID);

                         if(ServiceOnlineMinimumCpayAmount>CpayBalnce){
                              Gosip.Sent(SID,{ST:'D',RE:"NO_BAL"},"FOCE_ONLN");
                              Gosip.Sent(SID,{ST:'D'},"ONLINE_STET");
                              return;
                         }

                         if(ST=="HT"){
                              RECE(Dati_url+`/SERVICES/Hotels/${SID}/INFO`,Dati_Secret,function(hotelInfo){                              
                                   CurentServise[SID]={ID:SID,LAT:hotelInfo["HLLAT"],LON:hotelInfo["HLLON"],N:hotelInfo["HN"],T:hotelInfo["HotelType"],C:hotelInfo["HotelClass"],DP:hotelInfo["DP"]}
                                   localStorage.setItem("ONLINE_"+ST,JSON.stringify(CurentServise));
                                   Gosip.Sent(SID,{ST:'A'},"ONLINE_STET");
                              });
                         }else if(ST.includes('TX')){
                              RECE(Dati_url+`/SERVICES/Taxi/${SID}/INFO`,Dati_Secret,function(taxiinfo){
                                   CurentServise[SID]={ID:SID,LAT:data[0],LON:data[1],N:taxiinfo["VDN"],T:taxiinfo["VT"],DP:taxiinfo["DP"]}
                                   localStorage.setItem("ONLINE_"+ST,JSON.stringify(CurentServise));
                                   Gosip.Sent(SID,{ST:'A'},"ONLINE_STET");
                              });
                         } 
                         onlineServiceRegistry[SID]=ST;



                    })
               }else{
                    Gosip.Sent(SID,{'E':`Your Account was currently deactivated!`,ST:'D'},"ONLINE_STET");
               }
          })          
     }, 
     Remove:function(ST,SID,Byserver){
          var CurentServise=localStorage.getItem("ONLINE_"+ST);
          CurentServise=JSON.parse(CurentServise)||{};
          delete CurentServise[SID];
          localStorage.setItem("ONLINE_"+ST,JSON.stringify(CurentServise));

          if(!Byserver){
               Gosip.Sent(SID,{ST:'D'},"ONLINE_STET");
          }
          onlineServiceRegistry[SID]=ST;

          
     },
     SentCurent:async function(ST,SID){
          var CurentServise=localStorage.getItem("ONLINE_"+ST);
          CurentServise=JSON.parse(CurentServise)||{};

          var info=await getUserProfileInfo(SID,"Service",false)

          if(SID in CurentServise){
               Gosip.Sent(SID,{ST:'A',EX:info["EX"]},"ONLINE_STET");
          }else{
               Gosip.Sent(SID,{ST:'D',EX:info["EX"]},"ONLINE_STET");
          }
          onlineServiceRegistry[SID]=ST;
     },
     get:function(ST){
          var CurentServise=localStorage.getItem("ONLINE_"+ST);
          return JSON.parse(CurentServise)||{};
     },
     parseData:function(ST,SID){
          onlineServiceRegistry[SID]=ST;
          let allData=OnlineServises.get(ST)
          return allData[SID]
     },
     UudateTaxiLocatin:function(ST,SID,data){
          var CurentServise=localStorage.getItem("ONLINE_"+ST);
          CurentServise=JSON.parse(CurentServise)||{};
          if(CurentServise[SID]!=null){
               CurentServise[SID]['LAT']=data[0];
               CurentServise[SID]['LON']=data[1];               
               localStorage.setItem("ONLINE_"+ST,JSON.stringify(CurentServise));
          }
          onlineServiceRegistry[SID]=ST;
     },
     fetchRegistry:function(){
          let getingTags=["HT","TXTTUK"];
          let idcount=0
          getingTags.forEach(function(selectServiceItemToFetch){
               let ServieIds= Object.keys(OnlineServises.get(selectServiceItemToFetch));               
               ServieIds.forEach(function(Id){
                    onlineServiceRegistry[Id]=selectServiceItemToFetch;
                    idcount++
               })               
          });
          console.log(`${idcount} Servises are Fech to online Servise Rejister`);
     },
     getServiceType:function(SID){
          return onlineServiceRegistry[SID]
     }
}




///////////////////////////////////////////////////////     Select Servise for user using user location   ///////////////////////////////////////////////////

function FindRawServise(objects, inputLat, inputLon, radius) {
     const result = [];
 
     for (let key in objects) {
         const obj = objects[key];
         const distance = getDistance(inputLat, inputLon, obj.LAT, obj.LON);
                 
         if (distance <=radius) {
             result.push(obj);
         }
     }
 
     return result;
 }



function getDistance(lat1, lon1, lat2, lon2) {
     const R = 6371; // Radius of the Earth in kilometers
     const dLat = toRadians(lat2 - lat1);
     const dLon = toRadians(lon2 - lon1);
     const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
               Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
               Math.sin(dLon / 2) * Math.sin(dLon / 2);
     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
     return R * c; // Distance in kilometers
 }
 
 function toRadians(degrees) {
     return degrees * (Math.PI / 180);
 }



 function ServiceFindClass(OBJ, type, hotelClass) {

     return OBJ.filter(hotel  => {
          const matchesType = (type === 'AL' || hotel.T === type);
          const matchesClass = (hotelClass === 'AL' || hotel.C === hotelClass);
          return matchesType && matchesClass;
     });
 }



///////////////////////////////////////////////////////     Add Job History   ///////////////////////////////////////////////////
const monthAbbreviations = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN","JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function AddJobHistory(SerID,CliantName,CliantID,text,Amount){
     const currentDate = new Date();
     const monthCode = monthAbbreviations[currentDate.getMonth()];
     const dayOfMonth = currentDate.getDate(); 

     SEND("POST",Dati_url+"/JOB_HIST/"+monthCode+"/"+SerID+"/"+dayOfMonth,Dati_Secret,[CliantID,CliantName,getCurrentdate(),text,Amount]);
     DecreeseQuata(SerID);
}

function GetMonthCode(){
     const currentDate = new Date();
     return monthAbbreviations[currentDate.getMonth()];
}

function GetToday(){
     const currentDate = new Date();
     return currentDate.getDate()
}



///////////////////////////////////////////            Satis fi and points      //////////////////////////////////
function SentServicsWelcomePoints(SID,NAME,GENDER){
     setTimeout(function(){
          AddPointsToServis(SID,ServiceWelcoemPoints,"WELCOME POINT",`Hello ${getPronoun(GENDER, "T")} ${getInitialName(NAME)}, welcome to the Ceylonion Service Provider Portal (CSPP)! To get you started, we're giving you ${ServiceWelcoemPoints} of welcome points. We look forward to a successful journey together and are excited to have you with us. Stay with us and make job life easier❤🥰.`)
     },20000);     
}





function AddSatisfitoServis(Did,PID,Rat){
     var Parth;
     var TargetServisTypeCode=ServiseType.get(Did)
     if(TargetServisTypeCode=="TX"){
          Parth="Taxi";
     }else if(TargetServisTypeCode=="HT"){
          Parth="Hotels";
     }else{
          return;
     }

     RECE(Dati_url+`/SERVICES/${Parth}/${Did}/INFO/RATI`,Dati_Secret,function(rating){
          if(rating==null){
               rating=[0,0,0,0,0,0,0];               
          }
          rating[Rat]=rating[Rat]+1;
          SEND("PUT",Dati_url+`/SERVICES/${Parth}/${Did}/INFO/RATI`,Dati_Secret,rating);
                    
          Gosip.Sent(PID,"","RATED");
          Gosip.Sent(Did,Rat,"RATED");
     })
}



function AddPointsToServis(SID,POINT_COUNT,TITLE,MASSAGE){
     var Parth;
     var TargetServisTypeCode=ServiseType.get(SID);
     POINT_COUNT=parseInt(POINT_COUNT);
     if(TargetServisTypeCode=="TX"){
          Parth="Taxi";
     }else if(TargetServisTypeCode=="HT"){
          Parth="Hotels";
     }else{
          return;
     }

     RECE(Dati_url+`/SERVICES/${Parth}/${SID}/INFO/RATI`,Dati_Secret,function(rating){
          if(rating==null){
               rating=[0,0,0,0,0,0,0];               
          }
          rating[5]=parseInt(rating[5]||0)+parseInt(POINT_COUNT);
          SEND("PUT",Dati_url+`/SERVICES/${Parth}/${SID}/INFO/RATI`,Dati_Secret,rating);

          if(TITLE!=null){
               Gosip.Alert(SID,TITLE,MASSAGE);
          }

          Gosip.Sent(SID,POINT_COUNT,"POINTS");
     })

}

























//   <(|-----^--^-^----=<<<<<<<<<<       Admin Contrallation Futnions      >>>>>>>=----^-^--^--|)>

function ActiveServiceProvider(id,activationType){
     UptateLocalInfo_CoustomKey(id,"AT",activationType);
     SEND("PUT",Profi_url+"/Service/"+id+"/info/AT",Profi_Secret,activationType);
     if(activationType){
          Gosip.Alert(id,"ACCOUNT ACTIVATED","We are activate your account successfully,now you can use our application!");
     }else{
          Gosip.Alert(id,"ACCOUNT DEACTIVATED","We have decided to deactivate your account, now you cannot use our app fully functionally, contact us and ask why!");
     }

     let ServisType=OnlineServises.getServiceType(id)
     if(!activationType && OnlineServises.parseData(ServisType,id)){
          OnlineServises.Remove(ServisType,id);          
     }   
}


function BandUser(id,massage){
     let method=ServiseType.get(id)==null?"ACC":"Service";
     SEND(massage=='' || massage==null ?"DELETE":"PUT",Profi_url+"/"+method+"/"+id+"/info/BAN",Profi_Secret,massage);
     UptateLocalInfo_CoustomKey(id,"BAN",massage);

     if(massage && massage!=""){
          Gosip.Sent(id,massage,"BAN");
     }
     

}























function TestingPeriodeRegistorProced(id,Sate,NAME,GENDER){
     if(Sate=="WEL"){
          var massage=`ආයුබෝවන්! ඔබේ සේවාවන් සඳහා ඔබට උදව් කිරීමට නිර්මාණය කර ඇති මගේ යෙදුමට සාදරයෙන් පිළිගනිමු. මෙය පරීක්ෂණ මට්ටමේ ඇති යෙදවුමකි, නමුත් ඔබට දැනටමත් එය සමඟ මුදල් උපයා ගත හැකිය. ඔබට කිසියම් දෝෂයකට මුහුණ දීමට සිදුවුවහොත්, කරුණාකර "?" ක්ලික් කිරීමෙන් ඒවා වාර්තා කරන්න. ඔබ දැන් පලමුව කලයුත්තෙ "Vehicle Setting" , "Driver Account" , "Bank Details" සදහා ඔබෙ තොරතුරු ඇතුලත් කිරිමයි. ඔබ උපයා ගැනීම ආරම්භ කිරීමට පෙර යෙදවුම පිළිබද ඉගැනුම් වීඩියෝ බැලීමට මෙම notification මත ක්ලික් කරන්න.`;
          Gosip.Alert(id,"WELCOME TO BETA TEST!",massage,`["Alert.Close()","OpenWelcomeTutorial()"]`)
     }

     if(Sate=="DEVMAS"){
          var massage=`
සුභ දවසක් ${getPronoun(GENDER, "T")} ${getInitialName(NAME)}!, ඔබව මාගෙ "ceylonian service provider" යෙදවුමට සාදරයෙන් පිලිගනිමි. මෙය පරීක්ශන මට්ටමේ තිබෙ. මෙය වඩාත් උසස් බවට පත්කිරීමට සහය වීම පිලිබද මාගෙ ස්තූතිය පිරිනමන අතර ඔබ දක්වන සහයෝගය සදහා මා ඔබට ත්‍යාග ලකුනු ප්‍රමානයක් පිරිනමන අතර සොයාබැලීමකින් තොරව ඔබේ ගිනුම ස්වයන්ක්‍රීයව සක්‍රිය කරනු ඇත. එමෙන්ම ඔබට කොටා ත්‍යගයක්ද පිරිනමයි.

වර්තමානයෙ යෙදවුමක් විසින් තම සෙවා ලාභීන්ගෙන් ලබා ගන්නා කුඩාම මුදල මෙයින් ලබාගැනිමෙන් සේවා සපයන්නන්ට මෙන්ම සේවා ලාබීන්ටද මෙම යෙදවුම ඉතාමත් වාසි සහගත වෙ.

ඔබ සතුව ගමනක් යාමට අවශ්‍ය මගියෙකු සිටීනම්, එහෙත් යම් යම් හෙතුන්මත ඔබට යානොහැකි නම් එය වෙනත් අයකුට ලබා ගැනීමට මෙහි ප්‍රවර්දනය කර මුදල් උපයන්න.(එම ගමනෙන් ඔබට අවශ්‍ය කොමිස් මුදල සාදාරනව ඔබට ඉදිරිපත් කල හැක)

ඔබ හට යම් යම් දෝෂ හමුවුවහොත් මාහට "?" ඔබා "Bug" එකක් ලෙස් දැනුම්දෙන මෙන් ඉල්ලා සිටිමි,එමගින් මෙය වඩාත් උසස් පරිසරයක් නිර්මානය කිරිමට සහය දෙන්න.

මෙම notification එක ක්ලික් කිරිමෙන් අප ලබගන්නා කමිශන් මුදල් ගැනඅවබෝදයක් ලබ ගත හැක.ඔබට සුබ දවසක්,දිගටම අපසමග සිටින්න❤🥰

G Menura Abhisheka,
Founder/Developer/Maintainer and Owner,
${getCurrentdate()}
`;

setTimeout(function(){
     Gosip.Alert(id,"DEVELOPER MESSAGE!",massage,`["Alert.Close()","ShowComitionTiuTorial()"]`)
     TestingPeriodeRegistorProced(id,"FERRQT")
},5000)
          
     }
    

     if(Sate=="FERRQT"){
          var massage=`We give you 30 job quotas for free as a gift because you are helping us by sharing your ideas to make the application better while testing.`
          setTimeout(function(){
               UpdateQutaAcc(id,50);
               Gosip.Alert(id,"GIFT QUOTA",massage,`["Alert.Close()","FetchJobData(true)"]`)
               TestingPeriodeRegistorProced(id,"FREEMONNY")
          },3000)
         
     }


     if(Sate=="FREEMONNY"){
          var massage=`We provide you with Rs. 1500.00 for your earnings. You can check your balance by going to your "Cpay Wallet" or clicking this notification.`
          setTimeout(function(){
               CpayTopup(id,1500,"STARTER FUND");
               Gosip.Alert(id,"STARTER FUND",massage,`["Alert.Close()","OpenCpay()"]`)
               TestingPeriodeRegistorProced(id,"RATING")
          },3000)
          
     }
     

     if(Sate=="RATING"){
          var massage=`We have decided to give you 3,000 points and 10 "Very Satisfied" ratings as a gift.`
          var Parth;
          var TargetServisTypeCode=ServiseType.get(id)
          if(TargetServisTypeCode=="TX"){
               Parth="Taxi";
          }else if(TargetServisTypeCode=="HT"){
               Parth="Hotels";
          }else{
               return;
          }
          setTimeout(function(){
               SEND("PUT",Dati_url+`/SERVICES/${Parth}/${id}/INFO/RATI`,Dati_Secret,[0,0,0,0,10,3000,0]);
               Gosip.Alert(id,"GIFT TO GOLD!",massage);
               Gosip.Sent(id,3000,"POINTS");
               ActiveServiceProvider(id,true)
          },3000)
          
     }
     
     

}

