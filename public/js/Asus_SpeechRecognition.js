var version = "0.030.20250616"

console.log("import Asus_SpeechRecognition.js fullListen version = ",version)
var checktoke_status = false
var recognition_status = false
var sendbuffer_status_tmp = 0
var tmp_IP = null
var postURL = ''
var record_status = false
var disconnect_status = false
var samplerate_tmp = null
var userid_tmp = ''
var onlyone_status = false
var onerror_retry = 0
var online_status = true

//確認網路狀態
function checkNetworkStatus() {
    if (navigator.onLine) {
        console.log("status online");
    } else {
        console.log("status offline");
    }
}
// 監聽網路狀態變化
try {
    window.addEventListener('online', () => {
        online_status = true;
        try {
            if (userid_tmp != '' & postURL != ''){
                postDataToServer(postURL, userid_tmp, "online reconnect")
                .then(data => {
                    console.log('post request:', data);
                })
                .catch(error => {
                    console.log('post: ',error);
                });
            }
        } catch (err) {
            console.error('post error: ', err.toString());
        }
        console.log("online reconnect",online_status)});
    window.addEventListener('offline', () => {online_status = false; console.log("offline",online_status)});
} catch (err) {
    console.log('window.addEventListener error: ', err.toString());
}

// 非網路狀況的異常狀態回傳到server
function postDataToServer(url, userid, cmdtype) {
    // 將參數封裝為表單格式
    const postData = new URLSearchParams({
        userid: userid,
        cmdtype: cmdtype
    });
    // 發送 POST 請求
    return fetch(url, {
        method: 'POST',          // 使用 POST 方法
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded' // 使用表單格式
        },
        body: postData           // 傳送的內容
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json(); // 假設伺服器返回 JSON 資料
    })
    .catch(error => {
        console.log('已發送請求');
        throw error; // 繼續拋出錯誤以供外部處理
    });
}

// 使用範例
// postDataToServer('https://dsws-twcc.asus.com/restasr/article_test', '123456', 'QQQQQQ')
// .then(data => {
//     console.log('伺服器回應資料:', data);
// })
// .catch(error => {
//     console.log('伺服器已發送');
// });

class speechServer {
    constructor(process_message,callback,token_callback){
        this.process_message = process_message
        this.callback = callback
        this.token_callback = token_callback
        this.ws = ''
    }

    setClientId(){
        var d = Date.now();
            if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
                d += performance.now(); //use high-precision timer if available
            }
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
                return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
    }//setClientId

    start_connect(set_IP){
        console.log("websocket_connect")
        if (set_IP == null){
            set_IP = 'dswsstaging-lvcsr.asus.com'
        }
        console.log("set_IP = ",set_IP)
        var IP = set_IP
        // var IP = location.host;
        // var IP = 'dswsstaging-lvcsr.asus.com'
        // var IP = 'dswsdev-lvcsr.asus.com'
        // var IPname = location.hostname;
        tmp_IP = IP
        var ws = ''
        var userid = this.setClientId();    
        console.log("in websocket_connect = "+userid)
        userid_tmp = userid

        <!-- open websocket -->
        if ( !ws || (ws.readyState == 2 || ws.readyState == 3)){
            console.log("ws.readyState ===>",ws.readyState)
            var wssIP = "wss://" + IP+ "?Id="+userid //server
            //var wssIP = "ws://" + IP+ "/websocket?Id="+userid //local
            // var wssIP = "wss://" + IP+ "/websocket?id="+userid
            console.log("wssIP"+wssIP)
            ws = new WebSocket(wssIP);
            ws.binaryType = "blob";
            this.websocket_set(ws,this.callback);
            console.dir(ws)
            this.ws = ws
            console.log("startWebsocket ws.readyState="+ws.readyState+"time: "+new Date().getTime());
        }//websocket
        if (tmp_IP.includes('dev')){
            postURL = 'https://dswsdev.asus.com/restasr/article_test'
        }else if (tmp_IP.includes('staging')){
            postURL = 'https://dswsstaging.asus.com/restasr/article_test'
        }else if (tmp_IP.includes('twcc')){
            postURL = 'https://dsws-twcc.asus.com/restasr/article_test'
        }
        console.log("postURL--->",postURL)
    }//websocket_connect

    re_connect(tmp_IP){
        console.log("re websocket_connect")
        var IP = tmp_IP
        var ws = ''
        var userid = userid_tmp
        console.log("in re websocket_connect = "+userid)

        <!-- open websocket -->
        if ( !ws || (ws.readyState == 2 || ws.readyState == 3)){
            // var wssIP = "wss://" + IP+ "/websocket?Id="+userid
            var wssIP = "wss://" + IP+ "/websocket?id="+userid
            console.log("wssIP"+wssIP)
            ws = new WebSocket(wssIP);
            ws.binaryType = "blob";
            this.websocket_set(ws,this.callback);
            console.dir(ws)
            this.ws = ws
            console.log("startWebsocket ws.readyState="+ws.readyState+"time: "+new Date().getTime());
        }//websocket
    }//websocket_connect

    websocket_set(ws){
        var self = this;
        ws.onopen=function (message) {
            onerror_retry = 0
            console.log('onopen !!!!')
        }//onopen
        ws.onclose=function (e) {
            console.log('websocket 断开: ' + e.code + ' reason:' + e.reason + ' ' + e.wasClean)
            console.log("e.reason.toString()----->",typeof(e.wasClean))
            console.log("e.reason.toString()----->",e.wasClean)
            if (online_status == true){
                console.log("post onclose status to server",postURL)
                try {
                    var onclose_status = 'websocket 断开: code ' + e.code.toString() + ' reason:' + e.reason.toString() + ' ' + e.wasClean.toString()
                    postDataToServer(postURL, userid_tmp, onclose_status.toString())
                    .then(data => {
                        console.log('post request:', data);
                    })
                    .catch(error => {
                        console.log('post: ',error);
                    });
                } catch (err) {
                    console.error('post error: ', err.toString());
                }
            } else{
                var received_msg ={}
                received_msg['error'] = "error_網路異常請確認網路狀態"
            }
            if(e.code.toString() == "1006"){
                if (record_status == true){
                    console.log("re connect")
                    self.re_connect(tmp_IP)
                    disconnect_status = true
                }
                var received_msg ={}
                received_msg['error'] = "error_1006"
            }else if(e.wasClean.toString() == "true"){
                var received_msg ={}
                received_msg['websocket_status'] = "websocket close"
            }
            else{
                var received_msg ={}
                received_msg['error'] = "error_websocket_disconnect_1"
            }
            var msg = JSON.stringify(received_msg)
            self.process_message(msg)

            
        }//onclose
        ws.onmessage=function(evt){
            console.log("onmessage!!!!")   
            var received_msg=evt.data;  
            self.process_message(received_msg)
        }//onmessage
        ws.onerror = function(error) {
            console.log('WebSocket Error: ', error);
            var received_msg = {};
            received_msg['error'] = 'websocket_error';
            received_msg['error_detail'] = error.message || 'Unknown error';
            var msg = JSON.stringify(received_msg);
            self.process_message(msg);
            
            if (online_status == true){
                console.log("post onerror status to server")
                try {
                    var onclose_status = 'WebSocket Error: ' + error.toString();
                    
                    postDataToServer(postURL, userid_tmp, onclose_status.toString())
                        .then(data => {
                            console.log('post request:', data);
                        })
                        .catch(err => {
                            console.log('post: ', err);
                        });
                } catch (err) {
                    console.error('post error: ', err.toString());
                }
            }else{
                var received_msg = {};
                received_msg['error'] = "error_網路異常請確認網路狀態"
                var msg = JSON.stringify(received_msg);
                self.process_message(msg);
            }

        };//onerror
    }//websocket_set
    
    check_connect(){
        // console.log("in check  "+this.ws.readyState);
        var check
        if(this.ws && (this.ws.readyState == 1)){
            check = true
            return check
        }
        else{
            check = false
            return check
        }
    }//check
    sendstatus(status){
        this.ws.send(status)
    }
    close_connect(){
        this.ws.close()
    }
    sendbuffer(queue){
        <!--ws.readyState= 2: CLOSING/ 3:CLOSED-->
        if(this.ws && (this.ws.readyState == 1)){
            for(var i=0; i<=queue.length; i++) {
                this.ws.send(queue.shift());
            }        
        }
        else{
            console.log("no connection ws.readyState="+ ws.readyState);
        }
    }//sendbuffer
}//class


class speechRecognition {

    constructor(callback,check_token_callback){
        this.callback = callback
        this.token_callback = check_token_callback
        this.SN = ''
        this.start_recognition_status = false
        this.audioChunks_ch1 = []
        this.audioChunks_ch2 = []        
        this.timersend_status = false
        this.timerId = null
        this.set_IP = null
        this.set_dictationtimeout = null
        this.Server = new speechServer(this.process_message,this.callback,this.token_callback)
    }
    setIP(ip){
        this.set_IP = ip
    }
    setDictationTimeout(timeout){
        this.set_dictationtimeout = timeout
    }
    start_connect(token,room_num='roomnum'){
        var self = this
        var callback_message = this.process_message
        // this.Server = new speechServer(callback_message,this.callback,this.token_callback)
        var check_type = false
        var key = Object.keys(token);
        if(typeof(token) == "object" && key.includes('token') && key.includes('clientid')){
            check_type = true
            if(token['token'] == 0 || token['clientid'] == 0){
                check_type = false
            }
        }

        recognition_status = false
        sendbuffer_status_tmp = 0

        if(check_type == true){
            console.log("in start_connect set_IP = ",this.set_IP)
            self.Server.start_connect(this.set_IP)
            
            var connect = null
            var count = 0
            var checktoken_wait_status = false
            var retry_count = 0
            onerror_retry = 0
            
            function checkconnect(self,connect,count,checktoken_wait_status,room_num,retry_count){
                var checkconnect_callback = {}
                connect = self.Server.check_connect()
                console.log("connect == ",connect)
                if (connect == true){
                    if (checktoken_wait_status == false){
                        var token_str = JSON.stringify(token)
                        self.Server.sendstatus(token_str)
                        console.log("send token")
                        checktoken_wait_status = true
                        checkconnect_callback["token_check"]  = " 認證中 ..."
                        self.token_callback(checkconnect_callback)

                    }
                    else{
                        console.log("in timer",checktoke_status)
                        if (checktoke_status == false){
                            count = count + 1
                            checkconnect_callback["token_check"]  = " 認證中 ...."
                            self.token_callback(checkconnect_callback)
                            if(count == 10){
                                clearInterval(self.timerId);
                                checkconnect_callback["token_check"]  = "fail"
                                // checkconnect_callback['error'] = "connect fail"
                                checkconnect_callback['error'] = '10101, 連線到server失敗_1'
                                // checkconnect_callback['message'] = '連線到server失敗'
                                self.token_callback(checkconnect_callback)
                                self.stop_connect()
                                // alert("Waiting time is too long, please try again!!!")
                            }
                        }
                        else if (checktoke_status == true){
                            self.Server.sendstatus("room_num:"+room_num.toString())
                            self.Server.sendstatus("Asus_SpeechRecognition version = "+version.toString())
                            clearInterval(self.timerId);
                        }
                    }
                    
                }
                else{
                    count = count + 1
                    if (count >= 10 && onerror_retry > 5){
                        clearInterval(self.timerId);
                        checkconnect_callback["token_check"]  = "fail"
                        // checkconnect_callback['error'] = "connect fail"
                        checkconnect_callback['error'] = '10101, 連線到server失敗_2'
                        // checkconnect_callback['message'] = '連線到server失敗'
                        self.token_callback(checkconnect_callback)
                        self.stop_connect()
                        count = 0
                    }
                    if (count == 10 && onerror_retry <= 5){
                        self.stop_connect()
                        count = 0
                        retry_count = retry_count + 1
                        // alert("Waiting time is too long, please try again!!!")
                        self.retry_connect(retry_count)
                    }
                    else{
                        checkconnect_callback["token_check"]  = " 連線中 ...."
                        self.token_callback(checkconnect_callback)
                    }
                    console.log("check token unsuccess",count)
                    console.log("check token unsuccess ->",onerror_retry)
                }
                return [count,checktoken_wait_status]
            }

            this.timerId = setInterval( function () { 
                [count,checktoken_wait_status] = checkconnect(self,connect,count,checktoken_wait_status,room_num,retry_count); 
            }, 200);
        }
        else{
            var final_dic = {}
            final_dic['error_code'] = '10106'
            final_dic['message'] = '參數內容或格式錯誤'
            self.token_callback(final_dic)
        }
    }
    
    stop_connect(){
        recognition_status = false
        sendbuffer_status_tmp = 0
        this.Server.close_connect()
    }
    retry_connect(retry_count){
        console.log("in retry connect-->",retry_count)
        var self = this
        self.Server.start_connect(this.set_IP)
    }
    start_recognition(para){
        var self = this
        this.timersend_status_1 = false
        this.timersend_status_2 = false
        sendbuffer_status_tmp = 0
        if (checktoke_status == true){
            if(typeof(para) == "string"){
                if(this.start_recognition_status == false | disconnect_status == true){
                    console.log("in start_connect set_dictationtimeout",this.set_dictationtimeout)
                    if (this.set_dictationtimeout != null){
                        para = para+'_'+this.set_dictationtimeout
                    }
                    console.log("start_recognition ====>",para)
                    this.Server.sendstatus(para)
                    this.tmp_para = para
                    this.start_recognition_status = true
                    record_status = true
                    if (para.includes("onlyone")){
                        console.log("onlyone!!!!")
                        onlyone_status = true
                    }
                    recognition_status = true
                    console.log("start_recognition_status",this.start_recognition_status)
                }
                else{
                    var final_dic = {}
                    // console.log("start_recognition_status",this.start_recognition_status)
                    final_dic['error_code'] = '10109'
                    final_dic['message'] = '重複執行start_recognition()'
                    self.callback(final_dic)
                }
            }
            else{
                var final_dic = {}
                final_dic['error_code'] = '10106'
                final_dic['message'] = '參數內容或格式錯誤'
                self.callback(final_dic)
            }
        }
        else if(checktoke_status == false){
            var final_dic = {}
            final_dic['error_code'] = '10101'
            final_dic['message'] = '連線到server失敗_3'
            self.callback(final_dic)
        }
    }
    stop_recognition(){
        // console.log("testtest this.start_recognition_status",this.start_recognition_status)
        recognition_status = false
        sendbuffer_status_tmp = 0
        this.start_recognition_status = false
        this.timersend_status_1 = false
        this.timersend_status_2 = false
        record_status = false
        this.audioChunks_all = []
        // console.log("testtest this.start_recognition_status!!!!!!",this.start_recognition_status)
        this.Server.sendstatus('stop')
    }
    send(info){
        //console.log("====send====",typeof(info))
        //console.log(info)
        this.Server.sendstatus(info)
    }
    samplerate(sample_rate){
        console.log("set"+sample_rate)
        var set_samplerate = 'samplerate_' + sample_rate.toString()
        this.Server.sendstatus(set_samplerate)
        samplerate_tmp = sample_rate
    }
    start_stop_phrase(start_stop_phrase){
        console.log("set start_stop_phrase "+ start_stop_phrase)
        var set_start_stop_phrase = start_stop_phrase.toString()
        this.Server.sendstatus(set_start_stop_phrase)
    }
    set_extra_para(username){
        var para = {"set_extra_para": 'add extra para'}
        para["username"] = username;
        console.log("set set_extra_para: ",username)
        var extra_para = JSON.stringify(para)
        console.log("set set_extra_para: ",extra_para)
        this.Server.sendstatus(extra_para)
    }
    prompt_para(prompt_text){
        console.log("set prompt_para "+ prompt_text)
        var set_prompt_text = prompt_text.toString()
        this.Server.sendstatus(set_prompt_text)
    }
    sendbuffer(queue){
        var self = this
        if (recognition_status == false){
            sendbuffer_status_tmp += 1
        }
        if (checktoke_status == true & sendbuffer_status_tmp < 5){
            var check = this.Server.check_connect()
            if(online_status == false){
                var final_dic = {}
                final_dic['error_code'] = '30103'
                final_dic['message'] = '網路異常，請確認網路狀況後，重新連線'
                self.callback(final_dic)
            }
            if(check == false){
                if(record_status == true){
                    console.log("sendbuffer disconnect!!!!!")
                }
                else{
                    var final_dic = {}
                    final_dic['error_code'] = '30102'
                    final_dic['message'] = '與伺服器中途斷線，請確認網路狀況後，重新連線'
                    self.callback(final_dic)
                }
            }
            else{
                if(disconnect_status == true){
                    console.log("re start_recognition!!!!")
                    if (samplerate_tmp != null){
                        self.samplerate(samplerate_tmp)
                    }
                    setTimeout(function(){
                        console.log("self.tmp_para------->",self.tmp_para)
                        self.start_recognition(self.tmp_para)
                        disconnect_status = false
                    },50)
                    
                }
                else{
                    // audioChunks_all = queue
                    this.Server.sendbuffer(queue)
                }
            }
        }
        if(sendbuffer_status_tmp >= 30){
            var final_dic = {}
            final_dic['error_code'] = '10107'
            final_dic['message'] = 'API操作錯誤'
            self.callback(final_dic)
        }
        else if(checktoke_status == false){
            var final_dic = {}
            final_dic['error_code'] = '10101'
            final_dic['message'] = '連線到server失敗_4'
            self.callback(final_dic)
        }
        
    }
    sendbufferMultiChannel(arrayBuffer,channel){
        var check = this.Server.check_connect()
        if (onlyone_status == true){
            channel = 'ch2'
        }
        var self = this
            if(check == false){
                if(record_status == true){
                    console.log("sendbufferMultiChannel disconnect!!!!!")
                }
                else{
                    var final_dic = {}
                    final_dic['error_code'] = '30102'
                    final_dic['message'] = '與伺服器中途斷線，請確認網路狀況後，重新連線'
                    self.callback(final_dic)
                }
            }
            else{
                if(disconnect_status == true){
                    console.log("re start_recognition!!!!")
                    if (samplerate_tmp != null){
                        self.samplerate(samplerate_tmp)
                    }
                    setTimeout(function(){
                        self.start_recognition(self.tmp_para)
                        disconnect_status = false
                    },50)
                    
                }
                else{
                    if(channel == "ch1"){
                        this.sendbufferMultiChannel_1(arrayBuffer,"ch1")
                    }
                    else if (channel == "ch2"){
                        this.sendbufferMultiChannel_2(arrayBuffer,"ch2")
                    }
                }
            }
        
    }//sendbufferMultiChannel
    sendbufferMultiChannel_1(arrayBuffer,channel){
        var self = this
        console.log("===sendbufferMultiChannel===")
        // var audioChunks_all=[]
        if (checktoke_status == true){
            const str2ab = function(str) {
                var buf = new ArrayBuffer(str.length * 2); // 每个字符占用2个字节
                var bufView = new Uint8Array(buf);
                for (var i = 0, strLen = str.length; i < strLen; i++) {
                    bufView[i] = str.charCodeAt(i);
                }
                return buf;
            }//str2ab
            var channel_b = str2ab(channel)
            let combined = new Uint8Array(channel_b.byteLength + arrayBuffer.byteLength);//channel.byteLength + 
            combined.set(new Uint8Array(channel_b), 0);
            combined.set(new Uint8Array(arrayBuffer), channel_b.byteLength);
            // combined.set(new Uint8Array(arrayBuffer), 0);
            var com_ab = combined.buffer;
            
            const blob1 = new Blob([com_ab], {type : 'audio/wav'});
            console.log("blob"+channel,blob1)

            
            self.audioChunks_ch1.push(blob1);
            
            console.log("audioChunks_ch1 = ",self.audioChunks_ch1.length)
            function buffer_send(self){
                console.log("in timersend 1 ",self.start_recognition_status)
                console.log("audioChunks_ch1 2 = ",self.audioChunks_ch1.length)
                if (self.start_recognition_status == false){
                    console.log("in timersend 11")
                    clearInterval(timersend)
                }
                self.Server.sendbuffer(self.audioChunks_ch1)
                console.log("audioChunks_ch1 3 = ",self.audioChunks_ch1.length)
            }
            if(this.timersend_status_1 == false){
                var timersend = setInterval( function () { buffer_send(self)}, 100);
                this.timersend_status_1 = true    
            }
        }
        else if(checktoke_status == false){
            var final_dic = {}
            final_dic['error_code'] = '10101'
            final_dic['message'] = '連線到server失敗_5'
            self.callback(final_dic)
        }
        
        
    }//sendbufferMultiChannel
    sendbufferMultiChannel_2(arrayBuffer,channel){
        var self = this
        console.log("===sendbufferMultiChannel===")
        if (checktoke_status == true){
            const str2ab = function(str) {
                var buf = new ArrayBuffer(str.length * 2); // 每个字符占用2个字节
                var bufView = new Uint8Array(buf);
                for (var i = 0, strLen = str.length; i < strLen; i++) {
                    bufView[i] = str.charCodeAt(i);
                }
                return buf;
            }//str2ab
            var channel_b = str2ab(channel)
            let combined = new Uint8Array(channel_b.byteLength + arrayBuffer.byteLength);//channel.byteLength + 
            combined.set(new Uint8Array(channel_b), 0);
            combined.set(new Uint8Array(arrayBuffer), channel_b.byteLength);
            var com_ab = combined.buffer;
            
            const blob1 = new Blob([com_ab], {type : 'audio/wav'});
            console.log("blob"+channel,blob1)

            self.audioChunks_ch2.push(blob1);
            
            console.log("audioChunks_ch2 = ",self.audioChunks_ch2.length)
            function buffer_send(self){
                console.log("in timersend 2 ",self.start_recognition_status)
                console.log("audioChunks_ch2 2 = ",self.audioChunks_ch2.length)
                if (self.start_recognition_status == false){
                    console.log("in timersend 22")
                    clearInterval(timersend)
                }
                self.Server.sendbuffer(self.audioChunks_ch2)
                console.log("audioChunks_ch2 3 = ",self.audioChunks_ch2.length)
            }
            if(this.timersend_status_2 == false){
                var timersend = setInterval( function () { buffer_send(self)}, 100);
                this.timersend_status_2 = true    
            }
        }
        else if(checktoke_status == false){
            var final_dic = {}
            final_dic['error_code'] = '10101'
            final_dic['message'] = '連線到server失敗_6'
            self.callback(final_dic)
        }
        
        
    }//sendbufferMultiChannel
    check_connect(){
        var check = this.Server.check_connect()
        return check
    }
    get_result(param){
        this.Server.sendstatus(param)
    }
    process_message(received_msg){
        var self = this
        var final_dic = {}
        console.log("in process_message",received_msg)

        if (received_msg !== ""){
            console.log("received_msg:" + received_msg);
            var JSONObject = JSON.parse(received_msg);

            if(received_msg.includes("chatgpt")){
                console.log("chatgpt = ",JSONObject["chatgpt"])
                final_dic["chatgpt"] = JSONObject["chatgpt"]
                self.callback(final_dic)
            }
            if(received_msg.includes("twochannel_result")){
                console.log("twochannel_result = ",JSONObject["twochannel_result"])
                final_dic["twochannel_result"] = JSONObject["twochannel_result"]
                self.callback(final_dic)
            }
            if(received_msg.includes("token_check")){
                final_dic["token_check"] = JSONObject["token_check"]
                if (final_dic["token_check"] == "success"){
                    checktoke_status = true
                }
                else{
                    final_dic["error_code"] = JSONObject["error_code"]
                    checktoke_status = false
                }
                self.token_callback(final_dic)
                // console.log("!!!!!!",self.token_callback)
                // self.callback(final_dic)
            }
            if(received_msg.includes("channel") ){
                var channel = JSONObject["channel"]
                final_dic["channel"] = channel
            } 
            if(received_msg.includes("trigger_status") ){
                var trigger_status = JSONObject["trigger_status"];
                final_dic['trigger_status'] = trigger_status
                if(received_msg.includes("eos_length") ){
                    var eos_length = JSONObject["eos_length"];
                    final_dic['eos_length'] = eos_length
                }
                self.callback(final_dic)
            }//trigger_status
            if(received_msg.includes("LongTimeListen_timeout") ){
                var LongTimeListen_timeout = JSONObject["LongTimeListen_timeout"];
                final_dic['LongTimeListen_timeout'] = LongTimeListen_timeout

                self.callback(final_dic)
            }//LongTimeListen_timeout
            if(received_msg.includes("VAD_onBeginOfSpeech") ){
                var SN = JSONObject["SN"];
                this.SN = SN
                var isFinal = JSONObject["vad_status"];
                final_dic['status'] = isFinal
            }//beginOfSpeech
            else if(received_msg.includes("partial")){
                var result = JSONObject["partial"];
                var isFinal = JSONObject["isFinal"];
                if(isFinal == false){
                    result = result.replace(/[a-zA-Z]+/,'')
                }
                final_dic["result"] = result
                final_dic["isFinal"] = isFinal
                self.callback(final_dic)
            }
            else if(received_msg.includes("VAD_onEndOfSpeech")){
                var vad_status = JSONObject["vad_status"];
                var SLU_status = JSONObject["SLU_status"];
                if (SLU_status == 5){
                    final_dic['status'] = vad_status
                    self.callback(final_dic)
                }
            }//endOfSpeech
            else if(received_msg.includes("SpokenTimeout")){
                recognition_status = false
                sendbuffer_status_tmp = 0
                var vad_status = "VAD_onEndOfSpeech";
                var SLU_status = JSONObject["SLU_status"];
                if (SLU_status == 5){
                    final_dic['status'] = vad_status
                    self.callback(final_dic)
                }
            }//endOfSpeech
            else if (received_msg.includes("FinishRecognition")){
                // console.log("FinishRecognition")
                var FinishRecognition = JSONObject["status"];
                final_dic["status"] = FinishRecognition
                self.callback(final_dic)
            }
            else if (received_msg.includes("error_code")){
                final_dic['error_code'] = JSONObject['error_code']
                final_dic['message'] = JSONObject['message']
            }
            else if(received_msg.includes("error")){
                if(received_msg.includes("websocket_disconnect")){
                    final_dic["error"] = JSONObject['error']
                    self.callback(final_dic)
                }else if(received_msg.includes("error_1006")){
                    final_dic["error"] = JSONObject['error']
                    self.callback(final_dic)
                }
            }
            if (received_msg.includes("websocket_status")){
                final_dic["status"] = JSONObject['websocket_status']
                self.callback(final_dic)
            }
            if (received_msg.includes("tts_sentence")){
                final_dic["tts_sentence"] = JSONObject['tts_sentence']
                final_dic["tts_audio"] = JSONObject['tts_audio']
                final_dic["response_id"] = JSONObject['response_id']
                if (received_msg.includes("total")){
                    final_dic["index"] = JSONObject['index']
                    final_dic["total"] = JSONObject['total']
                }
                if (received_msg.includes("align_result")){
                    final_dic["align_result"] = JSONObject['align_result']
                }
                self.callback(final_dic)
            }
            if (received_msg.includes("tts_stop")){
                final_dic["tts_stop"] = JSONObject['tts_stop']
                self.callback(final_dic)
            }

        }//received_msg !== ""
        
    }//message

}//class

