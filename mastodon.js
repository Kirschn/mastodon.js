// mastodon javascript lib
// by @kirschn@pleasehug.me 2017
// no fucking copyright
// do whatever you want with it
// but please don't hurt it

var MastodonAPI = function(config) {
    var apiBase = config.instance + "/api/v1/";
    return {
        setConfig: function (key, value) {
            config[key] = value;
        },
        getConfig: function(key) {
            return config[key];
        },
        get: function (endpoint) {
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
                headers: {"Authorisation": "Bearer " + config.api_user_token},
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
                headers: {"Authorisation": "Bearer " + config.api_user_token},
                success: function(data, textStatus) {
                    console.log("Successful POST API request to " +apiBase+endpoint);
                    callback(data,textStatus)
                }
            });
        },
        delete: function (endpoint, callback) {
            $.ajax({
                url: apiBase + endpoint,
                type: "DELETE",
                headers: {"Authorisation": "Bearer " + config.api_user_token},
                success: function(data, textStatus) {
                    console.log("Successful DELETE API request to " +apiBase+endpoint);
                    callback(data,textStatus)
                }
            });
        },
        stream: function (endpoint, onData) {
            // Event Stream Support
            // using a polyfill needed for the auth header
            // https://github.com/Yaffle/EventSource/
            var es = new EventSource(apiBase + endpoint, { authorizationHeader: "Bearer " + config.api_user_token});
            var listener = function (event) {
                console.log("Got Data from Stream " + endpoint);
                onData(event);
            };
            es.addEventListener("open", listener);
            es.addEventListener("message", listener);
            es.addEventListener("error", listener);

        },
        registerApplication: function (client_name, redirect_uri, scopes, website, callback) {
            //register a new application
            //determine which parameters we got
            if (website === null) {
                website = "";
            }
            // build scope array to string for the api request
            var scopeBuild = "";
            if (typeof scopes === "object"){
                scopes.join(" ");
            }
            $.ajax({
                url: apiBase + endpoint,
                type: "POST",
                data: {
                    "client_name": client_name,
                    "redirect_uris": redirect_uri,
                    "scopes": scopes,
                    "website": website
                },
                headers: {"Authorisation": "Bearer " + config.api_user_token},
                success: function (data, textStatus) {
                    console.log("Registered Application: " + data);
                    callback(JSON.stringify(data));
                }
            });
        },
        generateAuthLink: function (client_id, redirect_uri, responseType, scopes) {
            return config.instance + "/oauth/authorize?client_id=" + cliend_id + "&redirect_uri=" + redirect_uri +
                    "&response_type=" + responseType + "&scope=" + scopes.join("+");
        }
    };
};