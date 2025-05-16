


var OTP_OBJ={};
function REcOTP(val){              
     val=val.val();
     if(val==null){return;}
     if(Object.keys(OTP_OBJ).length<=0){ 
          OTP_OBJ=val!=null?val:{};                    
          firebase.database().ref("OTP").remove().then(DecotdOTP);                    
     }
}

var TagOTP;
function DecotdOTP(){
     if(Object.keys(OTP_OBJ).length<=0){firebase.database().ref("OTP").once('value').then(REcOTP); return;}
     TagOTP=Object.keys(OTP_OBJ)[0];
     var obj=OTP_OBJ[TagOTP];

     var NewOTP=OTP.new(obj["N"]);
     if(obj["C"]=="SER_REG"){          
          SEND("POST",SCT_URL+"/OTP/",'',{ O:NewOTP,N:obj["N"],C:"SER_REG",ST:obj["ST"]});
     }else if(obj["C"]=="SER_LOG"){
          SEND("POST",SCT_URL+"/OTP/",'',{  O:NewOTP,N:obj["N"],C:"SER_LOG"});
     }else if(obj["C"]=="ULOG"){
          SEND("POST",SCT_URL+"/OTP/",'',{  O:NewOTP,N:obj["N"],C:"ULOG"});
     }else if(obj["C"]=="UREG"){
          SEND("POST",SCT_URL+"/OTP/",'',{  O:NewOTP,N:obj["N"],C:"UREG"});
     }
     GetNextOTP();
}





function GetNextOTP(){
     delete OTP_OBJ[TagOTP];
     DecotdOTP();               
}