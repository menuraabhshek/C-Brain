///////////////////////////////////////////////////////   Register and login   /////////////////////////////////////////////////////
function DecordRegist(obj){  
    
     if(obj["T"]=="R"){
          ToRegist(obj);
     }else if(obj["T"]=="L"){
          ToLoging(obj);
     }else if(obj["T"]=="REQRES"){
          var UID=Get_ROM_ID(obj["N"]);
          if(UID==null){
               Gosip.Sent(obj["N"],'',"NOAC");
          }else{
               Gosip.Sent(obj["N"],UID,"PWRE");
               var otp=OTP.new(obj["N"])
               SendSMStoNumber(obj["N"],`OTP for Reset Password - ${otp} -`);
          }
     }else if(obj["T"]=="RST"){

          obj["PW"]=Decrpt(obj["PW"],Get_ROM_Number(obj["ID"]),true)||'';
          if(obj["PW"]==''){ return;}

          obj["O"]=Decrpt(obj["O"],Get_ROM_Number(obj["ID"]),true)||'';         
          if(obj["O"]==''){ return;}

          ChangePasword(obj["ID"],obj["PW"],true)
     }
    
     console.log("reg",obj)
}

function ToRegist(data){ 
     
     if(Get_ROM_ID(data["P"])==null){          
          data["PW"]=Decrpt(data["PW"],data["P"],true)||'';
          if(data["PW"]==''){ return;}

          data["O"]=Decrpt(data["O"],data["P"],true)||'';         
          if(data["O"]==''){ return;}

          RECE(Profi_url+"/"+"LAST_USER",Profi_Secret,function(LastUID){
               LastUID=Cloud_To_desimal(String(LastUID))+1
               var CID=GetCloudID(LastUID)
               var Incrim=getRandomNumber(4,10);
               var start=getRandomNumber(3,20);

               var newrOBJ={
                    X:CID,
                    P:data["P"],
                    PW:data["PW"],
                    O:start,
                    I:Incrim,
                    RD:getCurrentdate()                         
               }
               SEND("PUT",Profi_url+"/"+"LAST_USER",Profi_Secret,CID);
               SEND("PUT",Profi_url+'/ACC/'+CID+"/info",Profi_Secret,newrOBJ);             

               NewRom(CID,data["P"]);
               SendUserActivitiLog(CID,"ACC","Welcome to cylonion");
               SendSystermLog("ACC",`${CID} Registered`);
               OTP.PutKey(CID,OTP.get(data["P"]));
               OTP.delete(data["P"])
               Atant(`Hey there! , New Ceylonian User was registered!`);

               var Logindata=Encript({X:CID,O:start,I:Incrim},CID)
               Gosip.Sent(data["P"],{L:Logindata},"ACSS");
          }) 
     }else{
          Gosip.Sent(data["P"],'',"ALD");
     }
}

function ToLoging(data){  
     data["PW"]=Decrpt(data["PW"],data["P"] ,true)||'';  
     if(data["PW"]==''){return;}

     data["O"]=Decrpt(data["O"],data["P"],true)||'';
     if(data["O"]==''){return;}

     var UID=Get_ROM_ID(data["P"]);
     if(UID!=null){
          RECE(Profi_url+"/ACC/"+UID+"/info",Profi_Secret,function(info){
               if(info==null){
                    Gosip.Sent(data["P"],'',"NONB");
                    return;
               }
               console.log("cloudInfo>",info);
               var useEnter=String(data["PW"]); 
               var cloudpass=String(info["PW"]);

               if(useEnter==cloudpass){
                    var Incrim=getRandomNumber(4,10);
                    var start=getRandomNumber(3,20);

                    info['I']=Incrim;
                    info['O']=start;
                    SEND("PUT",Profi_url+'/ACC/'+UID+"/info",Profi_Secret,info)
                   
                    SendUserActivitiLog(info["X"],"ACC","welcome back to account");
                    OTP.PutKey(UID,OTP.get(data["P"]));
                    OTP.delete(String(data["P"]));

                    var Logindata=Encript({PRO:info["PRO"],X:UID,O:start,I:Incrim,B:info["B"],N:info["N"]},UID);
                    
                    RECE(Profi_url+"/ACC/"+UID+"/PRF",Profi_Secret,function(ProfileData){
                         ProfileData=ProfileData||{};
                         ProfileData["DP"]=info['DP'];

                         Gosip.Sent(data["P"],{L:Logindata,P:ProfileData},"ACSS");  
                    })
                                     
                                   

               }else{
                    Gosip.Sent(data["P"],'',"PWINC");                   
               }
          })
     }else{
          Gosip.Sent(data["P"],'',"NONB");
     }
}


///////////////////////////////////////////////////////  User profile settings   /////////////////////////////////////////////////////


function recevedProfilrsettings(request){     
     var obj=request;
     VeryfiUser(obj["X"],obj['PW'],obj['O'],false,function(verifide,info){
          if(verifide){
               if(obj["M"]=="PRO_SET"){
                    SEND("PUT",Profi_url+'/ACC/'+obj["X"]+"/PRF/"+obj["K"],Profi_Secret,obj["D"])
                    if(obj["K"]=="N"){
                         SEND("PUT",Profi_url+'/ACC/'+obj["X"]+"/info/N",Profi_Secret,obj["D"])
                         UptateLocalInfo_CoustomKey(obj["X"],obj["K"],obj["D"]);                         
                    }
                    if(obj["K"]=="P"){
                         SEND("PUT",Profi_url+'/ACC/'+obj["X"]+"/info/P",Profi_Secret,obj["D"])
                         UptateLocalInfo_CoustomKey(obj["X"],obj["K"],obj["D"]);  
                    }
                    if(obj["K"]=="G"){
                         SEND("PUT",Profi_url+'/ACC/'+obj["X"]+"/info/G",Profi_Secret,obj["D"])
                         UptateLocalInfo_CoustomKey(obj["X"],obj["K"],obj["D"]);  
                    }

                    var calbacking={K:obj["K"],D:obj["D"]}
                    Gosip.Sent(obj["X"],calbacking,"PRUP");

               }else if(obj["M"]=="ACTI"){
                    RECE(Profi_url+"/ACC/"+obj["X"]+"/ACTIVITIS",Profi_Secret,function(History){ 
                         History = History || {};         
        
                         let historyArray = Object.values(History); 
                         
                         historyArray.sort(function (a, b) {
                              return new Date(b.T) - new Date(a.T);  // Sort in descending order of date
                         }); 
                         
                         if (historyArray.length > 30) {
                              historyArray = historyArray.slice(0, 30);
                         }                         
                         Gosip.Sent(obj["X"],historyArray,"ACTI");                         
                    })
                   
               }else if(obj["M"]=="DP_SET"){
                    SEND("PUT",Profi_url+'/ACC/'+obj["X"]+"/info/DP",Profi_Secret,obj["D"]);
                    UptateLocalInfo_CoustomKey(obj["X"],"DP",obj["D"]);
                    Gosip.Sent(obj["X"],'',"DP_SET");
                    console.log(obj["D"]);
               }else if(obj["M"]=="NEW_NUM"){
                    if(Get_ROM_ID(obj["N"])!=null){
                         Gosip.Sent(obj["X"],'ALD',"NEW_NUM_OTP");
                         return
                    }

                    OTP.new(obj["N"]);      

                    SendSMS(obj["X"],"OTP sent  to new number for Change Login Number. if not requested that immediately contact us")
                    SendSMStoNumber(obj["N"],`OTP for change mobile number - ${OTP.get(obj["N"])} -`);

                    Gosip.Sent(obj["X"],'OK',"NEW_NUM_OTP");

               }else if(obj["M"]=="NEW_OTP_NUM"){
                    if(OTP.get(obj["N"])==obj["C"]){
                         NewRom(obj["X"],obj["N"]);
                         Gosip.Sent(obj["X"],'OK',"LMNUP");
                    }else{
                         Gosip.Sent(obj["X"],'INC',"LMNUP");
                    }
               }else if(obj["M"]=="DIR_PW_CHA"){
                    obj["NP"]=Decrpt(obj["NP"],obj["X"] ,false)||''; 
                    if(obj["PW"]==''){ return;}
                    ChangePasword(obj["X"],obj["NP"],false);
                    
               }else if(obj["M"]=="IND_PW_REQ"){
                    OTP.new(Get_ROM_Number(obj["X"]));                    
                    SendSMS(obj["X"],`OTP For Reset Password - ${OTP.get(Get_ROM_Number(obj["X"]))} -`);
                    Gosip.Sent(obj["X"],'',"NEW_RES_OTP");
               }else if(obj["M"]=="IND_PW_CHA"){
                    obj["NP"]=Decrpt(obj["NP"],obj["X"] ,false)||'';
                    obj["OP"]=Decrpt(obj["OP"],obj["X"] ,false)||''; 

                    if(obj["OP"]==OTP.get(Get_ROM_Number(obj["X"]))){
                         ChangePasword(obj["X"],obj["NP"],false);
                    }else{
                         Gosip.Sent(obj["X"],'INO',"PWCH");
                    }                    
               }else if(obj["M"]=="BACKUP"){
                    UserSetingBackup(obj["X"],obj["BS"])      
               }else if(obj["M"]=="RESTORE"){
                    USerSettingRestore(obj["X"])      
               }else if(obj["M"]=="PROACT"){  

                    var moths=obj["C"]
                    var PricePerMonth=1000;
                    var Discount=2;
                    var Charge=0;
                    if(moths==1){                             
                         Charge=PricePerMonth;
                    }else{
                         var discount=Discount*moths;
                         var totalMonthprice=PricePerMonth*moths;
                         Charge=totalMonthprice-(totalMonthprice*(discount/100));                              
                    } 

                    CpayDeTopup(obj["X"],Charge,'PRO Activation',function(retuns){
                         if(retuns==true){
                              var Exdate=addMonthsToDate(getCurrentdate(),parseInt(moths))
                         
                              SEND("PUT",Profi_url+'/ACC/'+obj["X"]+"/info/PRO",Profi_Secret,Exdate);
                              UptateLocalInfo_CoustomKey(obj["X"],"PRO",Exdate);
                              Gosip.Sent(obj["X"],{I:'OK',E:Exdate},"PROACK");
                              Log.Income("PRO", obj["X"], Charge);
                         }else{
                              Gosip.Sent(obj["X"],{I:'NBAL'},"PROACK");    
                         }
                    })
               
               }               
          }
          
     })     
     
}

function addMonthsToDate(dateString, monthsToAdd) {     
     const date = new Date(dateString);
     date.setMonth(date.getMonth() + monthsToAdd);
 
     // Format the date as YYYY/MM/DD
     const year = date.getFullYear();
     const month = String(date.getMonth() + 1).padStart(2, '0'); // Ensure 2 digits
     const day = String(date.getDate()).padStart(2, '0'); // Ensure 2 digits
 
     return `${year}/${month}/${day}`;
 }


async function ChangePasword(id,newpass,isAutolog){   
     var info=await getUserProfileInfo(id,"ACC",false); 
     if(info==null){
          Gosip.Sent(id,'',"NOAC");
          return
     }

     if(isAutolog){
          

          var Incrim=getRandomNumber(4,10);
          var start=getRandomNumber(3,20);

          info['I']=Incrim;
          info['O']=start;
          info['PW']=newpass;
          SEND("PUT",Profi_url+'/ACC/'+id+"/info",Profi_Secret,info)
          

          SendUserActivitiLog(id,"ACC","welcome back to account");
          OTP.PutKey(id,OTP.get(Get_ROM_Number(id)));
          OTP.delete(Get_ROM_Number(id));

          var LogginData={
               X:id,
               O:start,
               I:Incrim,
               B:info["B"],
               N:info["N"]
          }
          

          Gosip.Sent(id,Encript(LogginData,id),"ACSS"); 
       
     }else{
          SEND("PUT",Profi_url+'/ACC/'+id+"/info/PW",Profi_Secret,newpass);
          Gosip.Sent(id,'',"PWCH");
     }
    
     delete UserProfileInfo[id];
}



function UserSetingBackup(id,data){
     var Date=getCurrentdate()
     SEND("PUT",Profi_url+"/ACC/"+id+"/BACKUP",Profi_Secret,data);
     SEND("PUT",Profi_url+"/ACC/"+id+"/info/B",Profi_Secret,Date);
     Gosip.Sent(id,Date,"BACKUPED");
     UptateLocalInfo_CoustomKey(id,"B",Date);
}

function USerSettingRestore(id){
     RECE(Profi_url+"/ACC/"+id+"/BACKUP",Profi_Secret,function(backups){
          Gosip.Sent(id,backups,"RESTORE");
     })
}


/////////////////////////////////////    Rejister Of Mobile number haddleing  (ROM)   ///////////////////////////////////////////////

var ROMdata={};
var Invert_ROMdata={};


function NewRom(Key,val){
     ROMdata[Key]=String(val);
     Invert_ROMdata[val]=String(Key);
     localStorage.setItem("ROM",JSON.stringify(ROMdata));
     localStorage.setItem("IROM",JSON.stringify(Invert_ROMdata));

     SEND("PUT",Profi_url+'/ROM/'+Key,Profi_Secret,val);
     return "New Rom Added";     
}

function Get_ROM_Number(Key){
     return ROMdata[String(Key)] || null;
}
function Get_ROM_ID(number){
     return Invert_ROMdata[String(number)] || null;
}


function ROM_Start(){
     ROMdata=JSON.parse(localStorage.getItem("ROM"));
     Invert_ROMdata=JSON.parse(localStorage.getItem("IROM"));
     ROMdata==null?{}:ROMdata
     Invert_ROMdata==null?{}:Invert_ROMdata

     SetUNI_CON_ST("Y","ROM STARTED","ROM");
     return "ROM Stared"
}

function Revert_ROM(){
     SetUNI_CON_ST("B","ROM DISCUSSING.....","ROM");
     RECE(Profi_url+'/ROM',Profi_Secret,function(ROMS){
          ROMS=ROMS||{}
          ROMdata=ROMS;
          Invert_ROMdata={};
          for (const [key, value] of Object.entries(ROMS)) {
               Invert_ROMdata[value] = key;
          }
          localStorage.setItem("ROM",JSON.stringify(ROMdata));
          localStorage.setItem("IROM",JSON.stringify(Invert_ROMdata));
          console.log("ROM Rivered");
          SetUNI_CON_ST("G","ROM RIVERTED","ROM");
                    
     })
}
 






///// ROM Helper Funtion




//function Revert