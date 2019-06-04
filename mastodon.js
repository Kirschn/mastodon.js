// mastodon javascript lib
// by @kirschn@pleasehug.me 2017
// no fucking copyright
// do whatever you want with it
// but please don't hurt it (and keep this header)


var MastodonAPI = function (config) {
    var apiBase = config.instance + "/api/v1/";

    function ajax(method, url, onSuccess, onError, data = null, headers = null) {
        let allowedMethods = ["GET", "POST", "PATCH", "DELETE"];
        if (allowedMethods.indexOf(method) < 0) {
            onError('Method not supported');
            return;
        }
        var xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        if (headers !== null && Object.prototype.toString.call(headers) === '[object Object]'){
            console.log(headers);
            let headerKeys = Object.keys(headers);
            for (var idx =0; idx < headerKeys.length; idx +=1){
                var headerKey = headerKeys[idx];
                var headerVal = headers[headerKey];
                xhr.setRequestHeader(headerKey, headerVal);
            }
        }
        xhr.onload = function () {
        if (xhr.readyState == 4 && (xhr.status >= 200 && xhr.status < 400)) {
                onSuccess(xhr);
            } else {
                onError(xhr);
            }
        };
        if (Object.prototype.toString.call(data) === '[object Object]') {
            console.log(data);
            xhr.send(JSON.stringify(data));
        } else {
            xhr.send(data);
        }
    }

    function checkArgs(args) {
        var checkedArgs;
        if (typeof args[1] === "function") {
            checkedArgs = { data: {}, callback: args[1] };
        } else {
            checkedArgs = { data: args[1], callback: args[2] };
        }

        return checkedArgs;
    }

    function addAuthorizationHeader(headers, token) {
        if (token) {
            headers.Authorization = "Bearer " + token;
        }

        return headers;
    }

    function onAjaxSuccess(url, op, xhr, callback, logData) {
        console.log("Successful " + op + " API request to " + url,
            ", status: " + xhr.statusText,
            ", HTTP status: " + xhr.status,
            ", data: " + (logData ? (JSON.stringify(xhr.responseJSON) || xhr.responseText) : "<skipped>"));
        if (typeof callback !== "undefined") {
            callback(JSON.parse(xhr.responseText) || xhr.statusText);
        }
    }

    function onAjaxError(url, op, xhr) {
        console.error("Failed " + op + " API request to " + url,
            ", status: " + xhr.statusText,
            ", error: " + xhr.responseText,
            ", HTTP status: " + xhr.status,
            ", response JSON: " + (JSON.stringify(xhr.responseJSON)  || 'no json'));
    }

    return {
        setConfig: function (key, value) {
            // modify initial config afterwards
            config[key] = value;
        },
        getConfig: function (key) {
            // get config key
            if (Object.keys(config).indexOf('key') > -1){
                return config[key];
            }
            return null;
        },
        get: function (endpoint) {
            // for GET API calls
            // can be called with two or three parameters
            // endpoint, callback
            // or
            // endpoint, queryData, callback
            // where queryData is an object { paramname1: "paramvalue1", paramname2: paramvalue2 }

            var args = checkArgs(arguments);
            var queryData = args.data;
            var callback = args.callback;
            var url = apiBase + endpoint;
            return ajax(
                "GET",
                url,
                function(xhr) {onAjaxSuccess(url, "GET", xhr, callback, false);},
                function(xhr) {onAjaxError(url, "GET", xhr);},
                queryData,
                addAuthorizationHeader({}, config.api_user_token)
            );
        },
        patch: function (endpoint) {
            // for PATCH API calls
            var args = checkArgs(arguments);
            var patchData = args.data;
            var callback = args.callback;
            var url = apiBase + endpoint;

            return ajax(
                "PATCH",
                url,
                function(xhr) {onAjaxSuccess(url, "PATCH", xhr, callback, false);},
                function(xhr) {onAjaxError(url, "PATCH", xhr);},
                patchData,
                addAuthorizationHeader({}, config.api_user_token),
                {'Content-Type': 'application/json'}
            );
        },
        post: function (endpoint) {
            // for POST API calls
            var args = checkArgs(arguments);
            var postData = args.data;
            var callback = args.callback;
            var url = apiBase + endpoint;

            return ajax(
                "POST",
                url,
                function(xhr) {onAjaxSuccess(url, "POST", xhr, callback, false);},
                function(xhr) {onAjaxError(url, "POST", xhr);},
                postData,
                addAuthorizationHeader({}, config.api_user_token),
                {'Content-Type': 'application/json'}
            );
        },
        postMedia: function (endpoint) {
            // for POST API calls
            // args.data: file(s) : document.getElementById("myfile").files[0];
            var args = checkArgs(arguments);
            var postData = args.data;
            var callback = args.callback;
            var url = apiBase + endpoint;
            var formData = new FormData();
            if (Object.prototype.toString.call(data) === '[object Array]') {
                for (var idx =0; idx < postData.length; idx +=1){
                    formData.append(postData[idx]);
                }
            } else {
                formData.append(postData);
            }
            return ajax(
                "POST",
                url,
                function(xhr) {onAjaxSuccess(url, "POST MEDIA", xhr, callback, false);},
                function(xhr) {onAjaxError(url, "POST MEDIA", xhr);},
                formData,
                addAuthorizationHeader({}, config.api_user_token)
            );
        },
        delete: function (endpoint, callback) {
            // for DELETE API calls.
            var url = apiBase + endpoint;
            return ajax(
                "DELETE",
                url,
                function(xhr) {onAjaxSuccess(url, "DELETE", xhr, callback, false);},
                function(xhr) {onAjaxError(url, "DELETE", xhr);},
                null,
                addAuthorizationHeader({}, config.api_user_token)
            );
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
            var es = new WebSocket("wss://" + apiBase.substr(8) + 
                "streaming?access_token=" + config.api_user_token + "&stream=" + streamType);
            var listener = function (event) {
                console.log("Got Data from Stream " + streamType);
                event = JSON.parse(event.data);
                event.payload = JSON.parse(event.payload);
                onData(event);
            };
            es.onmessage = listener;
        },
        registerApplication: function (client_name, redirect_uri, scopes, website, callback) {
            // register a new application

            // OAuth Auth flow:
            // First register the application
            // 2) get a access code from a user (using the link, generation function below!)
            // 3) insert the data you got from the application and the code from the user into
            // getAccessTokenFromAuthCode. Note: scopes has to be an array, every time!
            // For example ["read", "write"]

            // determine which parameters we got
            if (website === null) {
                website = "";
            }
            // build scope array to string for the api request
            if (typeof scopes !== "string") {
                scopes = scopes.join(" ");
            }
            var url = apiBase + "apps";

            return ajax(
                "POST",
                url,
                function(xhr) {onAjaxSuccess(url, "REGISTER", xhr, callback, true);},
                function(xhr) {onAjaxError(url, "REGISTER", xhr);},
                {
                    client_name: client_name,
                    redirect_uris: redirect_uri,
                    scopes: scopes,
                    website: website
                },
                {'Content-Type': 'application/json'}
            );
        },
        generateAuthLink: function (client_id, redirect_uri, responseType, scopes) {
            return config.instance + "/oauth/authorize?client_id=" + client_id + "&redirect_uri=" + redirect_uri +
                    "&response_type=" + responseType + "&scope=" + scopes.join("+");
        },
        getAccessTokenFromAuthCode: function (client_id, client_secret, redirect_uri, code, callback) {
            var url = config.instance + "/oauth/token";

            return ajax(
                "POST",
                url,
                function(xhr) {onAjaxSuccess(url, "TOKEN", xhr, callback, true);},
                function(xhr) {onAjaxError(url, "TOKEN", xhr);},
                {
                    client_id: client_id,
                    client_secret: client_secret,
                    redirect_uri: redirect_uri,
                    grant_type: "authorization_code",
                    code: code
                },
                {'Content-Type': 'application/json'}
            );
        }
    };
};

// node.js
if (typeof module !== "undefined") { module.exports = MastodonAPI; }
