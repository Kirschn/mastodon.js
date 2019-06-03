// mastodon javascript lib
// by @kirschn@pleasehug.me 2017
// no fucking copyright
// do whatever you want with it
// but please don't hurt it (and keep this header)


var MastodonAPI = function (config) {
    var apiBase = config.instance + "/api/v1/";

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

    function onAjaxSuccess(url, op, callback, logData) {
        return function (data, textStatus, xhr) {
            console.log("Successful " + op + " API request to " + url,
                      ", status: " + textStatus,
                      ", HTTP status: " + xhr.status,
                      ", data: " + (logData ? JSON.stringify(data) : "<skipped>"));

            if (typeof callback !== "undefined") {
                callback(data, textStatus);
            }
        };
    }

    function onAjaxError(url, op) {
        return function (xhr, textStatus, errorThrown) {
            console.error("Failed " + op + " API request to " + url,
                          ", status: " + textStatus,
                          ", error: " + errorThrown,
                          ", HTTP status: " + xhr.status,
                          ", response JSON: " + JSON.stringify(xhr.responseJSON));
        };
    }

    return {
        setConfig: function (key, value) {
            // modify initial config afterwards
            config[key] = value;
        },
        getConfig: function (key) {
            // get config key
            return config[key];
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

            // ajax function
            return $.ajax({
                url: url,
                type: "GET",
                data: queryData,
                headers: addAuthorizationHeader({}, config.api_user_token),
                success: onAjaxSuccess(url, "GET", callback, false),
                error: onAjaxError(url, "GET")
            });
        },
        patch: function (endpoint) {
            // for PATCH API calls
            var args = checkArgs(arguments);
            var postData = args.data;
            var callback = args.callback;
            var url = apiBase + endpoint;

            return $.ajax({
                url: url,
                type: "PATCH",
                data: postData,
                headers: addAuthorizationHeader({}, config.api_user_token),
                success: onAjaxSuccess(url, "POST", callback, false),
                error: onAjaxError(url, "POST")
            });
        },
        post: function (endpoint) {
            // for POST API calls
            var args = checkArgs(arguments);
            var postData = args.data;
            var callback = args.callback;
            var url = apiBase + endpoint;

            return $.ajax({
                url: url,
                type: "POST",
                data: postData,
                headers: addAuthorizationHeader({}, config.api_user_token),
                success: onAjaxSuccess(url, "POST", callback, false),
                error: onAjaxError(url, "POST")
            });
        },
        postMedia: function (endpoint) {
            // for POST API calls
            var args = checkArgs(arguments);
            var postData = args.data;
            var callback = args.callback;
            var url = apiBase + endpoint;

            return $.ajax({
                url: url,
                type: "POST",
                data: postData,
                contentType: false,
                processData: false,
                headers: addAuthorizationHeader({}, config.api_user_token),
                success: onAjaxSuccess(url, "POST MEDIA", callback, false),
                error: onAjaxError(url, "POST MEDIA")
            });
        },
        delete: function (endpoint, callback) {
            // for DELETE API calls.
            var url = apiBase + endpoint;
            return $.ajax({
                url: url,
                type: "DELETE",
                headers: addAuthorizationHeader({}, config.api_user_token),
                success: onAjaxSuccess(url, "DELETE", callback, false),
                error: onAjaxError(url, "DELETE")
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
                + "streaming?access_token=" + config.api_user_token + "&stream=" + streamType);
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
            return $.ajax({
                url: url,
                type: "POST",
                data: {
                    client_name: client_name,
                    redirect_uris: redirect_uri,
                    scopes: scopes,
                    website: website
                },
                success: onAjaxSuccess(url, "REGISTER", callback, true),
                error: onAjaxError(url, "REGISTER")
            });
        },
        generateAuthLink: function (client_id, redirect_uri, responseType, scopes) {
            return config.instance + "/oauth/authorize?client_id=" + client_id + "&redirect_uri=" + redirect_uri +
                    "&response_type=" + responseType + "&scope=" + scopes.join("+");
        },
        getAccessTokenFromAuthCode: function (client_id, client_secret, redirect_uri, code, callback) {
            var url = config.instance + "/oauth/token";
            return $.ajax({
                url: url,
                type: "POST",
                data: {
                    client_id: client_id,
                    client_secret: client_secret,
                    redirect_uri: redirect_uri,
                    grant_type: "authorization_code",
                    code: code
                },
                success: onAjaxSuccess(url, "TOKEN", callback, true),
                error: onAjaxError(url, "TOKEN")
            });
        }
    };
};

// node.js
if (typeof module !== "undefined") { module.exports = MastodonAPI; }
