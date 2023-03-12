/* eslint-disable no-unused-vars */
import $, {type} from "jquery";
import {sign} from "../entry/sending";

var globalChromeData = {};
var connectionPort;
var currentTab;
var chechPhotoTimeOut = false;
var globalButtonLenght = false;
var mySetIntervalTimeOut = false;
var flagLoader = false;
var countImgLenght = 0;
var flag = false;
var photoObj = {};
var flagObj = {};
var dynamicRules = {};
var userId = false;

var statusText = false;

updateStatus();

function getChatInfo(fullUrl) {
    flagLoader = true;
    let timestamp = new Date().getTime();

    let {pathname: pathnameCompanionId} = new URL(fullUrl);
    let companionId = Number(
        pathnameCompanionId.split("/api2/v2/chats/")[1].split("/")[0]
    );
    if (typeof flagObj[companionId] === "undefined") {
        flagObj[companionId] = {};
    }
    flagObj[companionId].loader = true;
    flagObj[companionId].tick = false;
    flagObj[companionId].need = true;
    let hash = sign(fullUrl, timestamp);
    let config = {};
    let additionalHeaders = [
        {name: "app-token", value: dynamicRules.app_token},
        {name: "x-bc", value: window.localStorage.getItem("bcTokenSha")},
    ];
    config.headers = {};
    additionalHeaders.forEach(
        (header) => (config.headers[header.name] = header.value)
    );
    config.headers.time = timestamp;
    config.headers.sign = hash;
    new Promise(function (resolve, reject) {
        $.ajax({
            type: "GET",
            url: `${fullUrl}`,
            dataType: "json",
            async: true,
            headers: config.headers,
            beforeSend: function () {
            },
            success: function (data) {
                let nextUrl;
                let {origin, pathname, search} = new URL(fullUrl);
                let hasMore = data.hasMore;
                if (data.list.length == 0) {
                    hasMore = false;
                }
                if (hasMore) {
                    if (fullUrl.indexOf("&id=") < 0) {
                        nextUrl = `${origin}${pathname}?limit=100&id=${
                            data.list[data.list.length - 1].id
                        }${search.split("?limit=100")[1]}`;
                    } else {
                        nextUrl = `${fullUrl.split("&id=")[0]}&id=${
                            data.list[data.list.length - 1].id
                        }&order=desc&skip_users=all`;
                    }
                }
                let result = {companionId: companionId};
                if (typeof photoObj[companionId] === "undefined") {
                    photoObj[companionId] = {};
                }

                data.list.forEach((msgElement) => {
                    if (msgElement.fromUser.id != companionId) {
                        if (msgElement.media.length > 0) {
                            if (typeof result.photoData === "undefined") {
                                result.photoData = [];
                            }
                            let msgUserId = userId;
                            let canPurchase = msgElement.canPurchase;
                            let canPurchaseReason = msgElement.canPurchaseReason;
                            let messageId = msgElement.id;
                            let isFree = msgElement.isFree;
                            let isOpened = msgElement.isOpened;
                            let price = msgElement.price;
                            let dateLastSend = msgElement.createdAt;
                            msgElement.media.forEach((mediaElement) => {
                                try {
                                    if (mediaElement.type != "audio") {
                                        let {pathname} = new URL(mediaElement.thumb);
                                        let {pathname: squarepPathname} = new URL(
                                            mediaElement.squarePreview
                                        );
                                        let photo = {};
                                        let mediaId = mediaElement.id;
                                        let thumb = pathname.split("_")[1];
                                        let squarePreview = squarepPathname.split("_")[1];
                                        let type = mediaElement.type;
                                        photo = {
                                            mediaId: mediaId,
                                            companionId: companionId,
                                            userId: msgUserId,
                                            messageId: messageId,
                                            type: type,
                                            canPurchase: canPurchase,
                                            canPurchaseReason: canPurchaseReason,
                                            isFree: isFree,
                                            isOpened: isOpened,
                                            price: price,
                                            name: thumb,
                                            squarePreview: squarePreview,
                                            dateLastSend: dateLastSend,
                                            galleryClass: "",
                                        };
                                        if (photo.canPurchaseReason == "free" && photo.price == 0) {
                                            photo.galleryClass = "blue";
                                        }
                                        if (
                                            photo.canPurchaseReason == "opened" &&
                                            photo.price != 0
                                        ) {
                                            photo.galleryClass = "green";
                                        }
                                        if (!photo.isFree && photo.price != 0) {
                                            photo.galleryClass = "red";
                                        }
                                        result.photoData.push(photo);
                                    }
                                } catch (e) {
                                    //
                                }
                            });
                        }
                    }
                });
                resolve({
                    data: result,
                    url: nextUrl,
                    hasMore: hasMore,
                });
            },
            error: function (err) {
                reject(err);
            },
        });
    }).then((data) => {
        if (
            typeof data.data.photoData != "undefined" &&
            data.data.photoData.length > 0
        ) {
            if (typeof photoObj[data.data.companionId] === "undefined") {
                photoObj[data.data.companionId] = {};
            }
            data.data.photoData.forEach((element) => {
                if (typeof photoObj[data.data.companionId].mediaData === "undefined") {
                    photoObj[data.data.companionId].mediaData = {};
                }
                if (
                    typeof photoObj[data.data.companionId].mediaData[element.mediaId] ===
                    "undefined"
                ) {
                    photoObj[data.data.companionId].mediaData[element.mediaId] = {};
                    photoObj[data.data.companionId].mediaData[element.mediaId] = element;
                }
                if (
                    typeof photoObj[data.data.companionId].mediaData[element.mediaId] !==
                    "undefined"
                ) {
                    let photo =
                        photoObj[data.data.companionId].mediaData[element.mediaId];
                    if (photo.canPurchaseReason == "free" && photo.price == 0) {
                        if (element.canPurchaseReason == "opened" && element.price != 0) {
                            photoObj[data.data.companionId].mediaData[element.mediaId] =
                                element;
                            photoObj[data.data.companionId].mediaData[
                                element.mediaId
                                ].galleryClass = "green";
                        } else if (
                            element.canPurchaseReason == "free" &&
                            element.price == 0
                        ) {
                            let photoDateSend = new Date(photo.dateLastSend);
                            let elementDateSend = new Date(element.dateLastSend);
                            if (elementDateSend > photoDateSend) {
                                photoObj[data.data.companionId].mediaData[element.mediaId] =
                                    element;
                            }
                            photoObj[data.data.companionId].mediaData[
                                element.mediaId
                                ].galleryClass = "blue";
                        }
                    }
                    if (photo.canPurchaseReason == "opened" && photo.price != 0) {
                        if (element.canPurchaseReason == "opened" && element.price != 0) {
                            let photoDateSend = new Date(photo.dateLastSend);
                            let elementDateSend = new Date(element.dateLastSend);
                            if (elementDateSend > photoDateSend) {
                                photoObj[data.data.companionId].mediaData[element.mediaId] =
                                    element;
                            }
                            photoObj[data.data.companionId].mediaData[
                                element.mediaId
                                ].galleryClass = "green";
                        }
                    }
                    if (!photo.isFree && photo.price != 0) {
                        if (element.canPurchaseReason == "opened" && element.price != 0) {
                            photoObj[data.data.companionId].mediaData[element.mediaId] =
                                element;
                            photoObj[data.data.companionId].mediaData[
                                element.mediaId
                                ].galleryClass = "green";
                        } else if (
                            element.canPurchaseReason == "free" &&
                            element.price == 0
                        ) {
                            photoObj[data.data.companionId].mediaData[element.mediaId] =
                                element;
                            photoObj[data.data.companionId].mediaData[
                                element.mediaId
                                ].galleryClass = "blue";
                        } else if (!element.isFree && element.price != 0) {
                            if (
                                photoObj[data.data.companionId].mediaData[element.mediaId]
                                    .galleryClass != "green"
                            ) {
                                let photoDateSend = new Date(photo.dateLastSend);
                                let elementDateSend = new Date(element.dateLastSend);

                                if (elementDateSend > photoDateSend) {
                                    photoObj[data.data.companionId].mediaData[element.mediaId] =
                                        element;
                                }
                                photoObj[data.data.companionId].mediaData[
                                    element.mediaId
                                    ].galleryClass = "red";
                            }
                        }
                    }
                }
            });
        }

        if (data.hasMore) {
            getChatInfo(data.url);
        } else {
            flagObj[companionId].loader = false;
            flagObj[companionId].tick = true;
            flagObj[companionId].need = true;
            flagLoader = false;
            flag = false;

            return;
        }
    });
}

// chatInfo logic start
function subscribedOnDuration(userID) {
    try {
        let timestamp = new Date().getTime();
        const fullUrl = `https://onlyfans.com/api2/v2/users/${userID}?view=subscriber`;
        let {pathname} = new URL(fullUrl);
        let hash = sign(fullUrl, timestamp);
        let config = {};
        let additionalHeaders = [
            {name: "app-token", value: dynamicRules.app_token},
            {name: "x-bc", value: window.localStorage.getItem("bcTokenSha")},
        ];
        config.headers = {};
        additionalHeaders.forEach(
            (header) => (config.headers[header.name] = header.value)
        );
        config.headers.time = timestamp;
        config.headers.sign = hash;
        return new Promise(function (resolve) {
            $.ajax({
                type: "GET",
                url: `${fullUrl}`,
                dataType: "json",
                async: true,
                headers: config.headers,
                beforeSend: function () {
                },
                success: function (data) {
                    resolve([data.subscribedOnDuration, data.subscribedOnData !== null ? data.subscribedOnData.totalSumm : null, data.subscribedOn]);
                },
            });
        });
    } catch (e) {
        //
    }
}

setTimeout(updateChatsInfo, 1000)

function updateChatsInfo() {
    if (userId !== false) {
        if ($('.swipeout.swipeout-list-item').length > 0) {
            let chatList = $('.swipeout.swipeout-list-item')
            $.each(chatList, (index, element) => {
                // if ($(element).hasClass('checkedChat')){
                //     if($(element).find('.b-chats__item__body.infoButtons').length == 0){
                //         $(element).removeClass('checkedChat')
                //     }
                // }
                if (!$(element).hasClass('checkedChat')) {
                    let regex = /\b#icon-mute\b/;
                    let chatID = $(element).get(0).querySelector('.swipeout-content div div').getAttribute('id')
                    if (regex.test(($(element).find('.g-icon.has-tooltip use').attr('href')))) {
                        $(element).find('.b-chats__item__user.b-username-row').css({
                            "backgroundColor": "#e28c8c",
                        })
                        if ($(element).find('.b-chats__item__body.infoButtons').length == 0) {
                            $(element).find('.b-chats__item__link').append(`<div data-v-6a2cd1be="" class="b-chats__item__body infoButtons"></div>`)
                        }
                    }
                    else if ($(element).find('.g-icon.has-tooltip use').attr('href') === '/theme/onlyfans/spa/icons/sprite.svg?rev=202303011546-a20df7c5cb#icon-alert') {
                        $(element).find('.b-chats__item__user.b-username-row').css({
                            "backgroundColor": "#e28c8c",
                        })
                        subscribedOnDuration(chatID).then((data) => {
                            if (data[1] != null) {
                                $(element).find('.b-chats__item__link').append(`<div data-v-6a2cd1be="" class="b-chats__item__body infoButtons"><button type="button" class="btn btn-outline-primary">$ ${data[1]}</button></div>`)
                            }
                            if (data[0] !== null) {
                                if ($(element).find('.b-chats__item__body.infoButtons').length == 0) {
                                    $(element).find('.b-chats__item__link').append(`<div data-v-6a2cd1be="" class="b-chats__item__body infoButtons"><button type="button" class="btn btn-outline-primary" style="margin-left: 15px">${data[0]}</button></div>`)
                                } else {
                                    $(element).find('.b-chats__item__body.infoButtons').append(`<button type="button" class="btn btn-outline-primary" style="margin-left: 15px">${data[0]}</button>`)
                                }
                            }
                            if ($(element).find('.b-chats__item__body.infoButtons').length == 0) {
                                $(element).find('.b-chats__item__link').append(`<div data-v-6a2cd1be="" class="b-chats__item__body infoButtons"></div>`)
                            }
                        })

                    } else {
                        subscribedOnDuration(chatID).then((data) => {

                            if (data[2] == true) {
                                $(element).find('.b-chats__item__user.b-username-row').css({
                                    "backgroundColor": "#C9F76F",
                                })
                                if (data[1] != null) {
                                    $(element).find('.b-chats__item__link').append(`<div data-v-6a2cd1be="" class="b-chats__item__body infoButtons"><button type="button" class="btn btn-outline-primary">$ ${data[1]}</button></div>`)
                                }
                                if (data[0] !== null) {
                                    if ($(element).find('.b-chats__item__body.infoButtons').length == 0) {
                                        $(element).find('.b-chats__item__link').append(`<div data-v-6a2cd1be="" class="b-chats__item__body infoButtons"><button type="button" class="btn btn-outline-primary" style="margin-left: 15px">${data[0]}</button></div>`)
                                    } else {
                                        $(element).find('.b-chats__item__body.infoButtons').append(`<button type="button" class="btn btn-outline-primary" style="margin-left: 15px">${data[0]}</button>`)
                                    }
                                }
                                if ($(element).find('.b-chats__item__body.infoButtons').length == 0) {
                                    $(element).find('.b-chats__item__link').append(`<div data-v-6a2cd1be="" class="b-chats__item__body infoButtons"></div>`)
                                }
                            } else {
                                if (data[1] != null) {
                                    $(element).find('.b-chats__item__link').append(`<div data-v-6a2cd1be="" class="b-chats__item__body infoButtons"><button type="button" class="btn btn-outline-primary">$ ${data[1]}</button></div>`)
                                }
                                if (data[0] !== null) {
                                    if ($(element).find('.b-chats__item__body.infoButtons').length == 0) {
                                        $(element).find('.b-chats__item__link').append(`<div data-v-6a2cd1be="" class="b-chats__item__body infoButtons"><button type="button" class="btn btn-outline-primary" style="margin-left: 15px">${data[0]}</button></div>`)
                                    } else {
                                        $(element).find('.b-chats__item__body.infoButtons').append(`<button type="button" class="btn btn-outline-primary" style="margin-left: 15px">${data[0]}</button>`)
                                    }
                                }
                                $(element).find('.b-chats__item__user.b-username-row').css({
                                    "backgroundColor": "#e28c8c",
                                })
                                if ($(element).find('.b-chats__item__body.infoButtons').length == 0) {
                                    $(element).find('.b-chats__item__link').append(`<div data-v-6a2cd1be="" class="b-chats__item__body infoButtons"></div>`)
                                }
                            }
                        })
                    }
                    $(element).addClass('checkedChat')
                }
            })
        }
    }
    setTimeout(updateChatsInfo, 1000)
}


// $(document).on('click', 'a[href^="/my/chats"]', function () {
//     setTimeout(updateChatsInfo, 1000)
// })
// chatInfo logic end

// unsend logic start
var unsendOffSet = 0
var unsendHasMore = true
var unsendDate = new Date((new Date().getTime()) - 62 * 24 * 60 * 60 * 1000)
var unsendCheckDate = true
var unsendToggleStatus = false

function deleteUnsendMessage(massMessID) {
    if (userId !== false) {
        try {
            let timestamp = new Date().getTime();
            const fullUrl = `https://onlyfans.com/api2/v2/messages/queue/${massMessID}`;
            let {pathname} = new URL(fullUrl);
            let hash = sign(fullUrl, timestamp);
            let config = {};
            let additionalHeaders = [
                {name: "app-token", value: dynamicRules.app_token},
                {name: "x-bc", value: window.localStorage.getItem("bcTokenSha")},
            ];
            config.headers = {};
            additionalHeaders.forEach(
                (header) => (config.headers[header.name] = header.value)
            );
            config.headers.time = timestamp;
            config.headers.sign = hash;
            config.headers.accept = "application/json, text/plain, *!/!*"
            fetch(fullUrl, {
                "headers": config.headers,
                "referrer": "https://onlyfans.com/my/mass_chats",
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": null,
                "method": "DELETE",
                "mode": "cors",
                "credentials": "include"
            }).then((data) => {
                data.text().then((data) => {
                    //
                })
            });
        } catch (e) {
            //
        }
    }
}

function getUnsendMassMessagesList() {
    if (unsendHasMore == true) {
        if (unsendToggleStatus == true) {
            if (userId !== false) {
                try {
                    let timestamp = new Date().getTime();
                    const fullUrl = `https://onlyfans.com/api2/v2/messages/queue/stats?offset=${unsendOffSet}&limit=100&format=infinite`;
                    let {pathname} = new URL(fullUrl);
                    let hash = sign(fullUrl, timestamp);
                    let config = {};
                    let additionalHeaders = [
                        {name: "app-token", value: dynamicRules.app_token},
                        {name: "x-bc", value: window.localStorage.getItem("bcTokenSha")},
                    ];
                    config.headers = {};
                    additionalHeaders.forEach(
                        (header) => (config.headers[header.name] = header.value)
                    );
                    config.headers.time = timestamp;
                    config.headers.sign = hash;
                    config.headers.accept = "application/json, text/plain, */*"
                    fetch(fullUrl, {
                        "headers": config.headers,
                        "referrer": "https://onlyfans.com/my/mass_chats",
                        "referrerPolicy": "strict-origin-when-cross-origin",
                        "body": null,
                        "method": "GET",
                        "mode": "cors",
                        "credentials": "include"
                    }).then((data) => {
                        data.text().then((data) => {
                            let finallyData = {}
                            let filterData = JSON.parse(data)
                            finallyData = filterData.list
                            finallyData.forEach((element) => {
                                let date = new Date(element.date)
                                if (date < unsendDate) {
                                    if (element.canUnsend == true) {
                                        deleteUnsendMessage(element.id)
                                    }
                                }
                            })
                            unsendHasMore = filterData.hasMore
                            unsendOffSet += 100
                            if (unsendHasMore == true) {   ////!!!!!
                                getUnsendMassMessagesList()
                            }
                        })
                    });
                } catch (e) {
                    //
                }
            }
        }
    }
}

$(document).on('click', "button[at-attr$='logout']", function () {
    userId = false
})

function createUnSendToggle() {
    if (userId == false) {
        if ($('.infoAuthPlease').length == 0) {
            $('.g-page-title.m-scroll-top').after(`<h3 style="margin-left: 10px; margin-right: 10px; color: red" class="infoAuthPlease">Turn on the extension</h3>`)
        }
    }
    if (userId !== false) {
        if ($('.infoAuthPlease').length > 0) {
            $('.infoAuthPlease').remove()
        }
    }
    if ($('.table-vs.b-table.m-mass-chats-stat').length > 0) {
        if ($('.form-check.form-switch.unSendToggle').length === 0) {
            $('.g-page-title.m-scroll-top').after(`<div class="form-check form-switch unSendToggle" style="margin-right: 10px; margin-left: 10px">
              <input class="form-check-input" type="checkbox" id="flexSwitchCheckDefault">
              <label class="form-check-label" for="flexSwitchCheckDefault">Unsend Mass Messeges</label>
            </div>`)
        }
    }
    setTimeout(createUnSendToggle, 1500)
}

setTimeout(createUnSendToggle, 1500)

$(document).on('click', '#flexSwitchCheckDefault', function () {
    if ($('#flexSwitchCheckDefault:checked').length > 0) {
        unsendToggleStatus = true
        unsendOffSet = 0
        unsendHasMore = true
        unsendCheckDate = true
        getUnsendMassMessagesList()
    } else {
        unsendToggleStatus = false
    }
})
// unsend logic end

// list logic start
var createdListID = null

function createNewList(listName) {
    if (userId !== false) {
        try {
            let timestamp = new Date().getTime();
            const fullUrl = `https://onlyfans.com/api2/v2/lists`;
            let {pathname} = new URL(fullUrl);
            let hash = sign(fullUrl, timestamp);
            let config = {};
            let additionalHeaders = [
                {name: "app-token", value: dynamicRules.app_token},
                {name: "x-bc", value: window.localStorage.getItem("bcTokenSha")},
            ];
            config.headers = {};
            additionalHeaders.forEach(
                (header) => (config.headers[header.name] = header.value)
            );
            config.headers.time = timestamp;
            config.headers.sign = hash;
            config.headers.accept = "application/json, text/plain, *!/!*"
            config.headers['content-type'] = "application/json"
            fetch(fullUrl, {
                "headers": config.headers,
                "referrer": "https://onlyfans.com/my/lists",
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": JSON.stringify({name: listName}),
                "method": "POST",
                "mode": "cors",
                "credentials": "include"
            }).then((data) => {
                data.text().then((data) => {
                    let filterData = JSON.parse(data)
                    createdListID = filterData.id
                })
            });
        } catch (e) {
            //
        }
    }
}

var messagesList = {messages: {}}
var hasMoreMassMessages = true
var offSetMassMessages = 0

setTimeout(getAllMassMessageList, 1000)
setTimeout(createElementsOnMassMessagePage, 3000)
setTimeout(createNavBarElementsOnMassMessagePage, 1000)


function getOneMassMessageMedia(massMessageID) {
    if (userId !== false) {
        try {
            let timestamp = new Date().getTime();
            const fullUrl = `https://onlyfans.com/api2/v2/messages/queue/${massMessageID}?format=scheduled`;
            let {pathname} = new URL(fullUrl);
            let hash = sign(fullUrl, timestamp);
            let config = {};
            let additionalHeaders = [
                {name: "app-token", value: dynamicRules.app_token},
                {name: "x-bc", value: window.localStorage.getItem("bcTokenSha")},
            ];
            config.headers = {};
            additionalHeaders.forEach(
                (header) => (config.headers[header.name] = header.value)
            );
            config.headers.time = timestamp;
            config.headers.sign = hash;
            return new Promise(function (resolve) {
                $.ajax({
                    type: "GET",
                    url: `${fullUrl}`,
                    dataType: "json",
                    async: true,
                    headers: config.headers,
                    beforeSend: function () {
                    },
                    success: function (data) {
                        resolve([data.media, data.mediaCount, data.text]);
                    },
                });
            });
        } catch (e) {
            //
        }
    }
}

function getUsersListMassMessage(idMessageMass) {
    if (userId !== false) {
        try {
            let timestamp = new Date().getTime();
            const fullUrl = `https://onlyfans.com/api2/v2/messages/queue/${idMessageMass}/buyers?limit=100&offset=0&skip_users_dups=1&marker=0`;
            let {pathname} = new URL(fullUrl);
            let hash = sign(fullUrl, timestamp);
            let config = {};
            let additionalHeaders = [
                {name: "app-token", value: dynamicRules.app_token},
                {name: "x-bc", value: window.localStorage.getItem("bcTokenSha")},
            ];
            config.headers = {};
            additionalHeaders.forEach(
                (header) => (config.headers[header.name] = header.value)
            );
            config.headers.time = timestamp;
            config.headers.sign = hash;
            return new Promise(function (resolve) {
                $.ajax({
                    type: "GET",
                    url: `${fullUrl}`,
                    dataType: "json",
                    async: true,
                    headers: config.headers,
                    beforeSend: function () {
                    },
                    success: function (data) {
                        resolve(data.list);
                    },
                });
            });
        } catch (e) {
            //
        }
    }
}

var createListMediaIDArray = []
var createDate
var createCountMedia = [0, 0, 0]  //all, video, photo
var createMassMessageID
var globalUsersMassMessagesArray = []


$(document).on('click', '.createListButtonClick', function () {
    if (userId !== false) {
        if ($('.form-select.timePeriodDrop').val() == "Time Period") {
            if ($('.creatingListInfo').length > 0) {
                $('.creatingListInfo').remove()
            }
            if ($('.alertTimeSelect').length == 0) {
                $('.form-select.timePeriodDrop').after('<h3 class="alertTimeSelect" style="margin-left: 10px;color: darkred">Please select date</h3>')
            }
        }
        if ($('.form-select.timePeriodDrop').val() !== "Time Period") {
            if ($('.alertTimeSelect').length > 0) {
                $('.alertTimeSelect').remove()
            }
            createListMediaIDArray = []
            createDate = null
            createCountMedia = [0, 0, 0]
            globalUsersMassMessagesArray = []

            createMassMessageID = (($(this).attr('id'))).replace('id', '')
            let todayDay = new Date()

            switch ($('.form-select.timePeriodDrop').val()) {
                case "1 week":
                    createDate = new Date(todayDay.getTime() - 7 * 24 * 60 * 60 * 1000)
                    break;
                case "1 month":
                    createDate = new Date(todayDay.getTime() - 31 * 24 * 60 * 60 * 1000)
                    break;
                case "3 month":
                    createDate = new Date(todayDay.getTime() - 93 * 24 * 60 * 60 * 1000)
                    break;
                case "6 month":
                    createDate = new Date(todayDay.getTime() - 186 * 24 * 60 * 60 * 1000)
                    break;
                case "1 year":
                    createDate = new Date(todayDay.getTime() - 365 * 24 * 60 * 60 * 1000)
                    break;
                case "2 years":
                    createDate = new Date(todayDay.getTime() - 730 * 24 * 60 * 60 * 1000)
                    break;
                case "all time":
                    createDate = false
                    break;
            }
            getOneMassMessageMedia(createMassMessageID).then((data) => {
                let newListName = data[2]
                let day = todayDay.getDate() < 10 ? "0" + todayDay.getDate() : todayDay.getDate()
                let month = (todayDay.getMonth() + 1) < 10 ? "0" + (todayDay.getMonth() + 1) : (todayDay.getMonth() + 1)
                let year = (todayDay.getFullYear() % 100) < 10 ? "0" + (todayDay.getFullYear() % 100) : (todayDay.getFullYear() % 100)
                let seconds = todayDay.getSeconds()
                if (newListName.length > 40) {
                    newListName = newListName.substr(0, 30)
                    let finallyStr = newListName + " " + day + "." + month + "." + year + " " + seconds
                    createNewList(finallyStr)
                } else {
                    let finallyStr = newListName + " " + day + "." + month + "." + year + " " + seconds
                    createNewList(finallyStr)
                }
                data[0].forEach((element) => {
                    createCountMedia[0] += 1
                    if (element['type'] === 'video') {
                        createCountMedia[1] += 1
                    }
                    if (element['type'] === 'photo') {
                        createCountMedia[2] += 1
                    }
                    createListMediaIDArray.push(element['id'])
                })
            })
            if ($('.creatingListInfo').length > 0) {
                $('.creatingListInfo').remove()
            }
            if ($('.creatingListInfo').length === 0) {
                $('.form-select.timePeriodDrop').after(`<h3 class="creatingListInfo" style="margin-left: 10px;color: darkred">Creating List</h3>`)
            }
            setTimeout(getMassMessageUsersList, 1500)
        }
    }
})


function getMassMessageUsersList() {
    if (userId !== false) {
        for (let key in messagesList.messages) {
            let date = new Date(messagesList.messages[key][1])
            if (date > createDate) {
                if (messagesList.messages[key][5] > 0) {
                    if (messagesList.messages[key][2] >= createCountMedia[0]) {
                        if (messagesList.messages[key][3] >= createCountMedia[1]) {
                            if (messagesList.messages[key][4] >= createCountMedia[2]) {
                                getOneMassMessageMedia(messagesList.messages[key][0]).then((data) => {
                                    let matches = 0
                                    for (let key in data[0]) {
                                        if (createListMediaIDArray.includes(data[0][key]["id"])) {
                                            matches += 1
                                        }
                                    }
                                    if (matches === createCountMedia[0]) {
                                        getUsersListMassMessage(messagesList.messages[key][0]).then((info) => {
                                            for (let key in info) {
                                                globalUsersMassMessagesArray.push(info[key]["id"])
                                            }
                                        })
                                    }
                                    if (matches < createCountMedia[0]) {
                                        //
                                    }
                                })
                            }
                        }
                    }
                }
            }
        }
    }
    setTimeout(addUsersToCreatedList, 14000)
}

function addUsersToCreatedList() {
    if (userId !== false) {
        // globalUsersMassMessagesArray = [3202072, 250780229, 3202072, 250780229] // !!!!! change
        if (globalUsersMassMessagesArray.length > 0) {
            let uniqueArr = globalUsersMassMessagesArray.filter((elem, index) => globalUsersMassMessagesArray.indexOf(elem) === index);
            postAddUsersToCreatedList(uniqueArr)
            if ($('.creatingListInfo').length > 0) {
                $('.creatingListInfo').text('List Created')
                $('.creatingListInfo').css('color', 'green')
            }
        } else {
            if ($('.creatingListInfo').length > 0) {
                $('.creatingListInfo').text('List Created without users')
                $('.creatingListInfo').css('color', 'darkred')
            }
        }
    }

}


function postAddUsersToCreatedList(buyersList) {
    if (userId !== false) {
        try {
            let timestamp = new Date().getTime();
            const fullUrl = `https://onlyfans.com/api2/v2/lists/users`;
            let {pathname} = new URL(fullUrl);
            let hash = sign(fullUrl, timestamp);
            let config = {};
            let additionalHeaders = [
                {name: "app-token", value: dynamicRules.app_token},
                {name: "x-bc", value: window.localStorage.getItem("bcTokenSha")},
            ];
            config.headers = {};
            additionalHeaders.forEach(
                (header) => (config.headers[header.name] = header.value)
            );
            config.headers.time = timestamp;
            config.headers.sign = hash;
            config.headers.accept = "application/json, text/plain, *!/!*"
            config.headers['content-type'] = "application/json"
            fetch(fullUrl, {
                "headers": config.headers,
                "referrer": `https://onlyfans.com/my/lists/${createdListID}`,
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": JSON.stringify({[createdListID]: buyersList}),
                "method": "POST",
                "mode": "cors",
                "credentials": "include"
            }).then((data) => {
                data.text().then((data) => {
                    let notAddUsersArr = []
                    let objectData = JSON.parse(data)
                    // eslint-disable-next-line no-prototype-builtins
                    if (objectData.hasOwnProperty("errors")) {
                        for (let key in objectData.errors[createdListID]) {
                            notAddUsersArr.push(Number(key))
                        }
                        let filteredArrUsers = buyersList.filter(item => !notAddUsersArr.includes(item))
                        postAddUsersToCreatedList(filteredArrUsers)
                    }
                })
            });
        } catch (e) {
            //
        }
    }
}

function createNavBarElementsOnMassMessagePage() {
    if (userId !== false) {
        if ($('.table-vs.b-table.m-mass-chats-stat').length > 0) {
            if (hasMoreMassMessages !== true) {   ///!!!!!
                if ($('.dataLoadedInfo').length > 0) {
                    $('.dataLoadedInfo').remove()
                }
                if ($('.form-select.timePeriodDrop').length === 0) {
                    $('.g-page-title.m-scroll-top').after(`
                <select class="form-select timePeriodDrop" style="width: 100px">
                  <option selected>Time Period</option>
                  <option >1 week</option>
                  <option >1 month</option>
                  <option >3 month</option>
                  <option >6 month</option>
                  <option >1 year</option>
                  <option >2 years</option>
                  <option >all time</option>
                </select>`)
                }
                // if ($('.btn.btn-info.stopSearching').length === 0) {
                //     $('.form-select.timePeriodDrop').after(`
                //     <button type="button" class="btn btn-info stopSearching" style="margin-left: 10px">Stop</button>
                // `)
                // }
            } else {
                if ($('.dataLoadedInfo').length === 0) {
                    $('.g-page-title.m-scroll-top').after(`<h3 class="dataLoadedInfo">Loading data</h3>`)
                }
                if ($('.dataLoadedInfo').length > 0) {
                    $('.dataLoadedInfo').text('Loading data')
                }
            }
        }
    }
    setTimeout(createNavBarElementsOnMassMessagePage, 1000)
}

function createElementsOnMassMessagePage() {
    if (userId !== false) {
        if ($('.table-vs.b-table.m-mass-chats-stat').length > 0) {
            if (hasMoreMassMessages !== true) {       ////!!!!!
                let massMessagesList = $('.vue-recycle-scroller__item-view')
                $.each(massMessagesList, (index, element) => {

                        if ($(element).find('.createListButtonClick').length > 0) {
                            $(element).find('.createListButtonClick').remove()
                            $(element).removeAttr('id')
                        }

                        let messageTitle = $(element).find('.g-truncated-text').text()
                        if (messageTitle !== "") {
                            let tmpTitle = messageTitle.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/¯/g, '').replace(/\\/g, '').replace(/_/g, '').replace(/\(/g, '').replace(/\)/g, '').replace(/ツ/g, '').replace(/\//g, '')
                            let filterTitle = '"' + tmpTitle.trimEnd() + '"'
                            // eslint-disable-next-line no-prototype-builtins
                            if (messagesList['messages'].hasOwnProperty(filterTitle)) {
                                let messageID = "id" + messagesList['messages'][filterTitle][0]
                                if ($(element).attr('id') === undefined) {
                                    $(element).attr('id', messageID)
                                    $(element).find("div[data-title$='Unsend']").append(`<button class="createListButtonClick" id="${messageID}" style="margin-left: 5px; color: black">Create List</button>`)
                                }
                            }
                        }
                    }
                )
            }
        }
    }
    setTimeout(createElementsOnMassMessagePage, 1000)
}

function getAllMassMessageList() {
    if (hasMoreMassMessages == true) {
        if (userId !== false) {
            try {
                let timestamp = new Date().getTime();
                const fullUrl = `https://onlyfans.com/api2/v2/messages/queue/stats?offset=${offSetMassMessages}&limit=100&format=infinite`;
                let {pathname} = new URL(fullUrl);
                let hash = sign(fullUrl, timestamp);
                let config = {};
                let additionalHeaders = [
                    {name: "app-token", value: dynamicRules.app_token},
                    {name: "x-bc", value: window.localStorage.getItem("bcTokenSha")},
                ];
                config.headers = {};
                additionalHeaders.forEach(
                    (header) => (config.headers[header.name] = header.value)
                );
                config.headers.time = timestamp;
                config.headers.sign = hash;
                config.headers.accept = "application/json, text/plain, */*"
                fetch(fullUrl, {
                    "headers": config.headers,
                    "referrer": "https://onlyfans.com/my/mass_chats",
                    "referrerPolicy": "strict-origin-when-cross-origin",
                    "body": null,
                    "method": "GET",
                    "mode": "cors",
                    "credentials": "include"
                }).then((data) => {
                    data.text().then((data) => {
                        let finallyData = {}
                        let filterData = JSON.parse(data)
                        finallyData = filterData.list
                        finallyData.forEach((element) => {
                            if (element.mediaTypes != null && element.text != "") {
                                let countPhoto = 0
                                let countVideo = 0
                                let countPurchased = 0
                                // eslint-disable-next-line no-prototype-builtins
                                if (element.mediaTypes.hasOwnProperty("photo")) {
                                    countPhoto = element.mediaTypes.photo
                                }
                                // eslint-disable-next-line no-prototype-builtins
                                if (element.mediaTypes.hasOwnProperty("video")) {
                                    countVideo = element.mediaTypes.video
                                }
                                let countAllMedia = countPhoto + countVideo
                                let messageID = element.text
                                let tmpTitle = messageID.replace(/\*/g, '').replace(/¯/g, '').replace(/\\/g, '').replace(/_/g, '').replace(/\(/g, '').replace(/\)/g, '').replace(/ツ/g, '').replace(/\//g, '').trimEnd()
                                messagesList["messages"][`"${tmpTitle}"`] = [element.id, element.date, countAllMedia, countVideo, countPhoto, element.purchasedCount === undefined ? 0 : element.purchasedCount]
                            }
                        })
                        hasMoreMassMessages = filterData.hasMore
                        offSetMassMessages += 100
                        //console.log(messagesList)
                        if (hasMoreMassMessages == true) {   ////!!!!!
                            getAllMassMessageList()
                        }
                    })
                });
            } catch (e) {
                //
            }
        }
    }
}

// list logic end


function getMeInfo() {
    try {
        let timestamp = new Date().getTime();
        const fullUrl = "https://onlyfans.com/api2/v2/users/me";
        let {pathname} = new URL(fullUrl);
        let hash = sign(fullUrl, timestamp);
        let config = {};
        let additionalHeaders = [
            {name: "app-token", value: dynamicRules.app_token},
            {name: "x-bc", value: window.localStorage.getItem("bcTokenSha")},
        ];
        config.headers = {};
        additionalHeaders.forEach(
            (header) => (config.headers[header.name] = header.value)
        );
        config.headers.time = timestamp;
        config.headers.sign = hash;
        return new Promise(function (resolve, reject) {
            $.ajax({
                type: "GET",
                url: `${fullUrl}`,
                dataType: "json",
                async: true,
                headers: config.headers,
                beforeSend: function () {
                },
                success: function (data, textStatus, jqXHR) {
                    resolve({userId: data.id, status: jqXHR.status});
                },
                error: function (err) {
                    reject(err);
                },
            });
        });
    } catch (e) {
        //
    }
}

function chechPhoto() {
    if (chechPhotoTimeOut) {
        clearTimeout(chechPhotoTimeOut);
    }
    let locationNow = window.location.href;
    if (locationNow.includes("/my/chats/chat/")) {
        if ($(".b-photos__item").length && !flag) {
            flag = true;
            countImgLenght = $(".b-photos__item").length;
            let {pathname: pathnameCompanionId} = new URL(window.location.href);
            let companionId = Number(
                pathnameCompanionId.split("/my/chats/chat/")[1].split("/")[0]
            );
            $(".b-photos__item").each(function () {
                if (typeof $(this).find("img")[0] !== "undefined") {
                    let {pathname} = new URL($(this).find("img")[0].src);
                    let imgName = pathname.split("_")[1];
                    if (typeof photoObj[companionId].mediaData !== "undefined") {
                        for (let elementIndex in photoObj[companionId].mediaData) {
                            let element = photoObj[companionId].mediaData[elementIndex];

                            if (imgName == element.name || imgName == element.squarePreview) {
                                // if (imgName == element.name)
                                if (element.galleryClass == "red") {
                                    $(this)
                                        .find(`img`)
                                        .before(
                                            `<div style="position: absolute; z-index: 9999999; display: block; color: white; bottom: 4px;   right: 4px;  background: #DC3D62;  border-radius: 10px;  padding: 4px 8px;   font-size: 14px;  font-weight: bold;">$${element.price} not paid</div>`
                                        );
                                }
                                if (element.galleryClass == "green") {
                                    $(this)
                                        .find(`img`)
                                        .before(
                                            `<div style="position: absolute; z-index: 9999999; display: block; color: white; bottom: 4px;   right: 4px;  background: #349038;  border-radius: 10px;  padding: 4px 8px;   font-size: 14px;  font-weight: bold;">$${element.price} paid</div>`
                                        );
                                }
                                if (element.galleryClass == "blue") {
                                    $(this)
                                        .find(`img`)
                                        .before(
                                            `'<div style="position: absolute; z-index: 9999999; display: block; color: white; bottom: 4px;   right: 4px;  background:#0091eae3;  border-radius: 10px;  padding: 4px 8px;   font-size: 14px;  font-weight: bold;">sent (free)</div>'`
                                        );
                                }
                            }
                        }
                    }
                }
            });
        } else {
            if ($(".b-photos__item").length == 0) {
                flag = false;
            }
        }
    }
    chechPhotoTimeOut = setTimeout(chechPhoto, 100);
}

function trackUrlChange() {
    let oldUrl = window.location.href;
    setInterval(() => {
        if (window.location.href !== oldUrl) {
            oldUrl = window.location.href;
            let {href} = new URL(window.location.href);
            if (window.location.href.includes("https://onlyfans.com/my/chats/chat")) {
                let fanId = href
                    .split("https://onlyfans.com/my/chats/chat/")[1]
                    .split("/")[0];
                getChatInfo(
                    `https://onlyfans.com/api2/v2/chats/${fanId}/messages?limit=100&order=desc&skip_users=all`
                );
                updateAfterMessageSent();
                updateIcon(fanId);
            }
        }
    }, 1000);
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (typeof request !== "undefined") {
        if (typeof request.connect !== "undefined") {
            sendResponse({iamHere: 1, statusText: statusText});
            return;
        }
    }
});
chrome.runtime.onConnect.addListener(function (port) {
    connectionPort = port;
    port.onMessage.addListener(function (msg) {
        if (typeof msg.currentTab !== "undefined") {
            currentTab = msg.currentTab;
        }
        if (msg.command == "connect") {
            connectionPort = port;

            connectionPort.postMessage({
                data: {statusText: statusText},
            });
            return;
        }
        if (msg.command == "buttonClick") {
            if (typeof msg.statusText !== "undefined") {
                statusText = msg.statusText;
            }
            localStorage[`extensionStatus`] = statusText == false ? "off" : "on";
            window.location.reload();
        }
    });
});

// eslint-disable-next-line no-unused-vars
function BGsend_message() {
    chrome.runtime.sendMessage({req: "req"}, function () {
    });
}

function updateStatus() {
    if (typeof localStorage[`extensionStatus`] !== "undefined") {
        statusText = localStorage[`extensionStatus`] == "off" ? false : true;
    } else {
        localStorage[`extensionStatus`] = statusText == false ? "off" : "on";
    }
}

if (statusText) {
    main();
}


function main() {
    if (typeof localStorage[`dynamicRules`] === "undefined") {
        BGsend_message();
    } else {
        dynamicRules = JSON.parse(localStorage["dynamicRules"]);
    }
    try {
        getMeInfo()
            .then((data) => {
                userId = data.userId;
                getAll().then((data) => {
                    globalChromeData = data.globalChromeData;
                    trackUrlChange();
                    chechPhoto();
                    let {href} = new URL(window.location.href);
                    if (window.location.href.includes("https://onlyfans.com/my/chats/chat")) {
                        let fanId = href
                            .split("https://onlyfans.com/my/chats/chat/")[1]
                            .split("/")[0];
                        getChatInfo(
                            `https://onlyfans.com/api2/v2/chats/${fanId}/messages?limit=100&order=desc&skip_users=all`
                        );
                        mySetInterval();
                        updateIcon(fanId);
                    }
                });
            })
            .catch((error) => {
                if (error.status == 400 || error.status == 401) {
                    dynamicRules = {};
                    BGsend_message();
                    dynamicRules = JSON.parse(localStorage["dynamicRules"]);
                    statusText = false;
                    localStorage[`extensionStatus`] = "off";
                }
            });

    } catch (e) {
        //
    }
}

function updateAfterMessageSent() {
    $("[at-attr='send_btn']").on("click", function () {
        let {href} = new URL(window.location.href);
        let fanId;
        if (window.location.href.includes("https://onlyfans.com/my/chats/chat")) {
            fanId = href
                .split("https://onlyfans.com/my/chats/chat/")[1]
                .split("/")[0];
        }
        setTimeout(
            getChatInfo(
                `https://onlyfans.com/api2/v2/chats/${fanId}/messages?limit=100&order=desc&skip_users=all`
            ),
            1000
        );
    });
}

function mySetInterval() {
    if (mySetIntervalTimeOut) {
        clearTimeout(mySetIntervalTimeOut);
    }
    if ($("[at-attr='send_btn']").length && !globalButtonLenght) {
        updateAfterMessageSent();
        globalButtonLenght = true;
    } else {
        if ($("[at-attr='send_btn']").length == 0) {
            globalButtonLenght = false;
        }
    }

    mySetIntervalTimeOut = setTimeout(mySetInterval, 500);
}

function createLoader() {
    $(".b-make-post__actions__btns")
        .children()
        .last()
        .after(
            '<div class="m-gray lod m-default-icon-size m-reset-width has-tooltip"><div ><div class="spinner"></div></div></div>'
        );
}

function deleteLastChildren() {
    $(".b-make-post__actions__btns").children().last().remove();
}

function createTick() {
    $(".b-make-post__actions__btns")
        .children()
        .last()
        .after(
            '<div class="m-gray tick m-default-icon-size m-reset-width has-tooltip"><span class="label-group-addon"><svg class="g-icon blue" aria-hidden="true"><use xlink:href="/theme/onlyfans/spa/icons/sprite.svg?rev=202302161326-210f5ce29d#icon-done" href="/theme/onlyfans/spa/icons/sprite.svg?rev=202302161326-210f5ce29d#icon-done"></use></svg></span></div>'
        );
}

function updateIcon(fanId) {
    setInterval(() => {
        if (window.location.href.includes("https://onlyfans.com/my/chats/chat")) {
            if ($(".b-make-post__actions__btns").children().length > 0) {
                if (flagLoader) {
                    if (
                        typeof $(".b-make-post__actions__btns").children()[9] ===
                        "undefined"
                    ) {
                        createTick();
                    }
                    if ($(".b-make-post__actions__btns").children()[9]) {
                        if (
                            $(".b-make-post__actions__btns")
                                .children()[9]
                                .className.includes("lod")
                        ) {
                            //
                        }
                        if (
                            $(".b-make-post__actions__btns")
                                .children()[9]
                                .className.includes("tick")
                        ) {
                            deleteLastChildren();
                            createLoader();
                        }
                    }
                }
                if (!flagLoader) {
                    if (
                        typeof $(".b-make-post__actions__btns").children()[9] ===
                        "undefined"
                    ) {
                        createTick();
                    }
                    if (
                        $(".b-make-post__actions__btns")
                            .children()[9]
                            .className.includes("tick")
                    ) {
                        //
                    }
                    if (
                        $(".b-make-post__actions__btns")
                            .children()[9]
                            .className.includes("lod")
                    ) {
                        deleteLastChildren();
                        createTick();
                    }
                }
            }
        }
    }, 500);
}

setInterval(() => {
    if (countImgLenght != $(".b-photos__item").length) {
        countImgLenght = $(".b-photos__item").length;
        flag = false;
    }
}, 1000);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.msg == "updateDynamicRules") {
        dynamicRules = request.data;
        localStorage[`dynamicRules`] = JSON.stringify(dynamicRules);
    }
});

async function getAll() {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.local.get("globalChromeData", function (result) {
                resolve(result);
            });
        } catch (e) {
            reject(e);
        }
    });
}

setInterval(function () {
    if ($(".g-btn").length != 0) {
        $('button[at-attr="logout"]').click(function () {
            statusText = false;
            localStorage[`extensionStatus`] = "off";
        });
    }
}, 1000);
