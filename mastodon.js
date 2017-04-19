// mastodon javascript lib
// by @kirschn@pleasehug.me 2017
// no fucking copyright
// do whatever you want with it
// but please don't hurt it (and keep this header)

var MastodonAPI = function(config) {
    var apiBase = config.instance + "/api/v1/";
    return {
        setConfig: function (key, value) {
            // modify initial config afterwards
            config[key] = value;
        },
        getConfig: function(key) {
            //get config key
            return config[key];
        },
        get: function (endpoint) {
            // for GET API calls
            // can be called with two or three parameters
            // endpoint, callback
            // or
            // endpoint, queryData, callback
            // where querydata is an object {["paramname1", "paramvalue1], ["paramname2","paramvalue2"]}

            // variables
            var queryData, callback,
                queryStringAppend = "?";

            // check with which arguments we're supplied
            if (typeof arguments[1] === "function") {
                queryData = {};
                callback = arguments[1];
            } else {
                queryData = arguments[1];
                callback = arguments[2];
            }
            // build queryData Object into a URL Query String
            for (var i in queryData) {
                if (queryData.hasOwnProperty(i)) {
                    if (typeof queryData[i] === "string") {
                        queryStringAppend += queryData[i] + "&";
                    } else if (typeof queryData[i] === "object") {
                        queryStringAppend += queryData[i].name + "="+ queryData[i].data + "&";
                    }
                }
            }
            // ajax function
            $.ajax({
                url: apiBase + endpoint + queryStringAppend,
                type: "GET",
                headers: {"Authorization": "Bearer " + config.api_user_token},
                success: function(data, textStatus) {

                    //weeey it was successful
                    console.log("Successful GET API request to " +apiBase+endpoint);

                    //aaand start the callback
                    //might have to check what "textStatus" actually is, jquery docs are a bit dodgy
                    callback(data,textStatus);
                }
            });
        },
        post: function (endpoint) {
            // for POST API calls
            var postData, callback;
            // check with which arguments we're supplied
            if (typeof arguments[1] === "function") {
                postData = {};
                callback = arguments[1];
            } else {
                postData = arguments[1];
                callback = arguments[2];
            }
            $.ajax({
                url: apiBase + endpoint,
                type: "POST",
                data: postData,
                headers: {"Authorization": "Bearer " + config.api_user_token},
                success: function(data, textStatus) {
                    console.log("Successful POST API request to " +apiBase+endpoint);
                    callback(data,textStatus)
                }
            });
        },
        delete: function (endpoint, callback) {
            // for DELETE API calls.
            $.ajax({
                url: apiBase + endpoint,
                type: "DELETE",
                headers: {"Authorization": "Bearer " + config.api_user_token},
                success: function(data, textStatus) {
                    console.log("Successful DELETE API request to " +apiBase+endpoint);
                    callback(data,textStatus)
                }
            });
        },
        stream: function (streamType, onData) {
            // Event Stream Support
            // websocket streaming is undocumented. i had to reverse engineer the fucking web client.
            // streamType is either
            // user for your local home TL and notifications
            // public for your federated TL
            // public:local for your home TL
            // hashtag&tag=fuckdonaldtrump for the stream of #fuckdonaldtrump
            // callback gets called whenever new data ist recieved
            // callback { event: (eventtype), payload: {mastodon object as described in the api docs} }
            // eventtype could be notification (=notification) or update (= new toot in TL)
            var es = new WebSocket("wss://" + apiBase.substr(8)
                +"streaming?access_token=" + config.api_user_token + "&stream=" + streamType);
            var listener = function (event) {
                console.log("Got Data from Stream " + streamType);
                event = JSON.parse(event.data);
                event.payload = JSON.parse(event.payload);
                onData(event);
            };
            es.onmessage = listener;


        },
        registerApplication: function (client_name, redirect_uri, scopes, website, callback) {
            //register a new application

            // OAuth Auth flow:
            // First register the application
            // 2) get a access code from a user (using the link, generation function below!)
            // 3) insert the data you got from the application and the code from the user into
            // getAccessTokenFromAuthCode. Note: scopes has to be an array, every time!
            // For example ["read", "write"]

            //determine which parameters we got
            if (website === null) {
                website = "";
            }
            // build scope array to string for the api request
            var scopeBuild = "";
            if (typeof scopes !== "string") {
                scopes = scopes.join(" ");
            }
            $.ajax({
                url: apiBase + "apps",
                type: "POST",
                data: {
                    client_name: client_name,
                    redirect_uris: redirect_uri,
                    scopes: scopes,
                    website: website
                },
                success: function (data, textStatus) {
                    console.log("Registered Application: " + data);
                    callback(data);
                }
            });
        },
        generateAuthLink: function (client_id, redirect_uri, responseType, scopes) {
            return config.instance + "/oauth/authorize?client_id=" + client_id + "&redirect_uri=" + redirect_uri +
                    "&response_type=" + responseType + "&scope=" + scopes.join("+");
        },
        getAccessTokenFromAuthCode: function (client_id, client_secret, redirect_uri, code, callback) {
            $.ajax({
                url: config.instance + "/oauth/token",
                type: "POST",
                data: {
                    client_id: client_id,
                    client_secret: client_secret,
                    redirect_uri: redirect_uri,
                    grant_type: "authorization_code",
                    code: code
                },
                success: function (data, textStatus) {
                    console.log("Got Token: " + data);
                    callback(data);
                }
            });
        }
    };
};

// node.js
if (typeof module !== 'undefined') { module.exports = MastodonAPI; };
