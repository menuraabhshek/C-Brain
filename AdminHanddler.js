

let admFun={
    CpayTopup:function(object){
        
        if(!object.I || !object.A){            
            return "NODATA"
        }else if(!Get_ROM_Number(object.I)){
            return "NOACC"
        }        
        const amount=parseInt(object.A);
        const admRemark=object.R?'-'+object.R:''
        if(amount>0){
            CpayTopup(object.I,amount, "ADMIN TOPUP"+admRemark)
        }else{            
            CpayDeTopup(object.I,amount, "ADM DEB"+admRemark);
        }
        
    },
    read(object){
        let Parth=object.P;
        let patharrys=Parth.split("/");
        
        if(patharrys.length<=1){
            adminGosip.Error(object.I,"Inaccessible Path!")
            return
        }

        if(["ADMINS"].includes(patharrys[0])){
            adminGosip.Error(object.I,"Inaccessible Path!")
            return
        }
        

        RECE(Profi_url+`/${Parth}`,Profi_Secret,function(data){  
            adminGosip.Sent(object.I,data,"READED");
       })
    },
    GetTopupREQ:function(object,admID){
        const method=object.M;
        const id=object.I
        if(method=="DEL"){
            if(Object.keys(localPaymentStore).includes(id)){
                RemovePaymentReqest(id)
            }
            adminGosip.Sent(admID,id,"CALBK");           
        }else if(method=="TP"){
            const Data=localPaymentStore[id];
            if(Data){
                const UserId=Data.X;
                const amount=Data.A;
                console.log(UserId,amount);
                if(Data.O){
                    CpayDeTopup(UserId,amount,"Mistaken Top-up Refund");
                }else{
                    CpayTopup(UserId,amount,"DIRECT TOPUP");
                }               
                RemovePaymentReqest(id)
                adminGosip.Sent(admID,id,"CALBK");
            }
            
        }        
    }
}



function AdminRequest(reqData){
    console.log(reqData);
    const METHOD=reqData.M;
    const REQESTER_ID=reqData.I;
    const REQESTER_PASS=reqData.P;
    const REQESTER_FUNC=reqData.F;
    const REQESTER_DATAOBJ=reqData.D;

    const chaker=admin.chakAdm(REQESTER_ID,REQESTER_PASS);
   

    if(!chaker){
        adminGosip.Sent(REQESTER_ID,'',"NOADM");
        return;
    }


    if(METHOD=="LOG"){
        let adminaccses=admin.getAcces(REQESTER_ID);
        adminGosip.Sent(REQESTER_ID,adminaccses,"LOG");
        return;
    }

    const hasAccess=admin.chakAccess(REQESTER_ID,REQESTER_FUNC);
    console.log(REQESTER_FUNC);
    if(!hasAccess){
        adminGosip.Sent(REQESTER_ID,'',"NOACC");
        return;
    }

    
    if(METHOD=="CTF"){  // CTF - call to function.
        CalltoAdminFuntion(REQESTER_ID,REQESTER_FUNC,REQESTER_DATAOBJ)
    }
}




function CalltoAdminFuntion(admId,funtionName,stringOBJ){    
    stringOBJ=stringOBJ||{};
    let callingFuntion=admFun[funtionName]
    let retuns=callingFuntion(stringOBJ,admId);

    

    if(retuns=="NODATA"){
        adminGosip.Error(admId,"Data missing!")
    }else if(retuns=="NOACC"){
        adminGosip.Error(admId,"NO CPAY ACOUNT!")
    }    
}

































//////////////////////////////////////////      Admin Needed funtions       ////////////////////////////
let adminGosip={
    Error: function (id, rerro) {
        var EncriptData= { "T": 'E', E: rerro }       
        SEND("POST", SCT_URL + "/GOSIP/" + id, UNI_Secret,EncriptData);
    },
    Sent: function (id, data, identyty) {
        var EncriptData={ "T": identyty, R: data }
        SEND("POST", SCT_URL + "/GOSIP/" + id, UNI_Secret,EncriptData );
    },
    Respond: function (id, text) {
        var EncriptData= { "T": 'R', R: text }            
        SEND("POST", SCT_URL + "/GOSIP/" + id,UNI_Secret, EncriptData);
    }
}






const firebaseReflectConfig =!isTestServer? {
    apiKey: "AIzaSyDiTldS6TD4Vsfzfno2fTSMFo4ExOmXLNQ",
    authDomain: "celonion-replicator.firebaseapp.com",
    databaseURL: "https://celonion-replicator-default-rtdb.firebaseio.com",
    projectId: "celonion-replicator",
    storageBucket: "celonion-replicator.firebasestorage.app",
    messagingSenderId: "142185446468",
    appId: "1:142185446468:web:0f939072c101b3960a9011",
    measurementId: "G-9VVCN92GN6"
}:{
    apiKey: "AIzaSyDpX-tiHxWYeC0hUyaQkZSN__GLdwJ66kc",
    authDomain: "ceylonianparadise.firebaseapp.com",
    databaseURL: "https://ceylonianparadise-default-rtdb.firebaseio.com",
    projectId: "ceylonianparadise",
    storageBucket: "ceylonianparadise.appspot.com",
    messagingSenderId: "1011250081058",
    appId: "1:1011250081058:web:4408f9e69f5f8e0e3fc97b",
    measurementId: "G-7KRE20FF8T"
};
var SCT_URL=firebaseReflectConfig.databaseURL;;



var RflectorFireBase=firebase.initializeApp(firebaseReflectConfig,"ReflectApp");

const Rflectordatabase = RflectorFireBase.database();
const RflectorStorage = RflectorFireBase.storage();



function LisnnToAdminReqest() {
    
    var databaseRef = Rflectordatabase.ref("ADM_REQ");
    databaseRef.on('child_added', function (snapshot) {
        var key = snapshot.key;
        var value = snapshot.val();

        console.log(value);
        AdminRequest(Saniti(value))
        NOTIF();
        databaseRef.child(key).remove();
    });
}
LisnnToAdminReqest()



//////////////////////////////      add admin       ///////////////////////////////////////
let admins={}   ///  {ID:"",password:"",Name:"",Accses:""}
const admin = {
    callback: null,
    data: {},
    allCheckList: [],
    overlay: document.getElementById("adminOverlay"),
    nameInput: document.getElementById("adminName"),
    idInput: document.getElementById("adminID"),
    passwordInput: document.getElementById("adminPassword"),
    accessListDiv: document.getElementById("accessList"),

    add(data = {}, allCheckList = [], callback) {
        this.data = data;
        this.allCheckList = allCheckList;
        this.callback = callback;

        // Fill inputs
        this.nameInput.value = data.Name || "";
        this.idInput.value = data.ID || "";
        this.passwordInput.value = data.Password || "";

        this.idInput.disabled=!data.ID?false:true;
        this.idInput.style.opacity=!data.ID?"1":"0.1";

        // Generate checkboxes
        this.accessListDiv.innerHTML = "";
        allCheckList.forEach(item => {
            const label = document.createElement("label");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = item;
            checkbox.checked = (data.Accses || []).includes(item);
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(item));
            this.accessListDiv.appendChild(label);
        });

        this.overlay.classList.add("active");
    },
    save() {
        const REQESTER_ID=this.idInput.value.trim()
        const ISOLDID=Object.keys(admins).includes(REQESTER_ID)

        const updatedData = {
            Name: this.nameInput.value.trim(),
            ID: REQESTER_ID,
            Password: this.passwordInput.value.trim(),
            Accses: Array.from(this.accessListDiv.querySelectorAll("input:checked")).map(cb => cb.value)
        };

        if (this.callback) this.callback(updatedData);
        this.close();

        if(ISOLDID){
            let adminaccses=admin.getAcces(REQESTER_ID);
            adminGosip.Sent(REQESTER_ID,adminaccses,"LOG");
        }
    },
    close() {
        this.overlay.classList.remove("active");
    },
    fetch(){
        RECE(Profi_url + '/ADMINS', Profi_Secret, function (cloudadmins) {
            admins=cloudadmins;
        })        
    },
    get(id){
        return admins[id]||{}
    },
    set(ditails){
        const ID=ditails.ID

        admins[ID]=ditails;
        SEND("PUT", Profi_url + '/ADMINS/' + ID, Profi_Secret, ditails);
    },
    openAdminDitailsPannel(id){
        admin.add(
            admin.get(id),
            Object.keys(admFun),
            (updatedData) => {
                admin.set(updatedData);                
            }
        );
    },
    getAdminPass(adminId){
        return this.get(adminId).Password;
    },
    chakAdm(id,pass){
        return this.getAdminPass(id) == pass;
    },
    chakAccess(adminId,access){
        let myCurentAccsess=this.getAcces(adminId);
        return myCurentAccsess.includes(access)
    },
    getAcces(adminId){
        return this.get(adminId).Accses || [];
    }

};
admin.fetch()




// Open the panel for testing
//setTimeout(openAdminPanel, 1000);