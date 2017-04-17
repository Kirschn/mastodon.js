// mastodon javascript lib
// by @kirschn@pleasehug.me 2017
// no fucking copyright
// do whatever you want with it
// but please don't hurt it

var MastodonAPI = function(config) {
    var apiBase = config.instance + "/api/v1/";
    return {
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
                headers: {"Authorisation": " " + config.api_user_token},
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
                headers: {"Authorisation": " " + config.api_user_token},
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
                headers: {"Authorisation": " " + config.api_user_token},
                success: function(data, textStatus) {
                    console.log("Successful DELETE API request to " +apiBase+endpoint);
                    callback(data,textStatus)
                }
            });
        }
    };
};