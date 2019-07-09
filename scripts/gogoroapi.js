
//document.querySelector('#btnQuery').addEventListener("click", queryClick);
document.querySelector('#city').addEventListener("change", queryCityClick);
document.querySelector('#area').addEventListener("change", queryAreaClick);
var map;
var zipCode;
var allStationInformation;
var marker = [];
var dataChoose;
getZipCode();
getGOGOROData(true);

//Event
function queryCityClick() {
    dataChangeTocbbArea(zipCode);
    findGogoroStation(false);
}
function queryAreaClick() {
    findGogoroStation(false);
}

//抓取定位
var locations;
if (navigator.geolocation) {
    // HTML5 定位抓取
    navigator.geolocation.getCurrentPosition(function (position) {
        getLocation(position.coords.latitude, position.coords.longitude);
    },
        function (error) {
            switch (error.code) {
                case error.TIMEOUT:
                    alert('TIMEOUT');
                    break;
                case error.POSITION_UNAVAILABLE:
                    alert('POSITION_UNAVAILABLE');
                    break;
                case error.PERMISSION_DENIED: // 拒絕
                    alert('PERMISSION_DENIED');
                    break;
                case error.UNKNOWN_ERROR:
                    alert('UNKNOWN_ERROR');
                    break;
            }
        });
}

//定位
function getLocation(latitude, longitude) {
    locations = { 'latitude': latitude, 'longitude': longitude };
    map = L.map('map').setView([locations.latitude, locations.longitude], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '<a href="https://www.openstreetmap.org/">OSM</a>',
        maxZoom: 18,
    }).addTo(map);
}

function removeAllRemarkers() {
    if (marker) {
        marker.map(function (elem, idx) {
            map.removeLayer(elem);
        });
    }
}

//Distinct City in Array
function uniqueCityData(data) {
    var distinctData = [];
    data.map(function (elem, idx) {
        let tmpCity = { "cityName": elem.COUNTYNAME, "cityID": elem.COUNTYID };
        if (distinctData.filter((x) => x.cityName == tmpCity.cityName) == 0)
            distinctData.push(tmpCity);
    });
    distinctData = distinctData.sort(function (a, b) {
        return a.cityID > b.cityID ? 1 : -1;
    })
    return distinctData;
}

function clearSelect(selectId) {
    var targetSelect = document.getElementById(selectId);
    targetSelect.options.length = 0;
}

function addMarkerAndBindPopup(name, latitude, longitude) {
    let tmpmarker = new L.marker([latitude, longitude]);
    tmpmarker.addTo(map).bindPopup(name);
    return tmpmarker;
}
//combobox init
function addAllOption(select)
{
    let option = document.createElement("option");
    option.value = 'all'
    option.text = "全部";
    select.add(option);
}
function dataInitTocbbCity(data) {
    let distinctData = uniqueCityData(data);
    clearSelect('city');
    let cbbCity = document.querySelector("#city");
    addAllOption(cbbCity);

    distinctData.map(function (elem, idx) {
        option = document.createElement("option");
        option.value = elem.cityID;
        option.text = elem.cityName;
        cbbCity.add(option);
    });
}
function dataChangeTocbbArea(data) {
    let citySelect = document.querySelector('#city').selectedOptions[0].innerHTML;

    let distinctData = citySelect == '全部' ? data : data.filter(function (elem) {
        return elem.COUNTYNAME == citySelect;
    });
    clearSelect('area');
    let cbbArea = document.querySelector("#area");
    
    addAllOption(cbbArea);

    distinctData.map(function (elem, idx) {
        option = document.createElement("option");
        option.value = elem.ZIPCODE;
        option.text = elem.TOWNNAME;
        cbbArea.add(option);
    });
}
//抓取行政區對應郵遞區號的JSON
function getZipCode() {
    let url = "json/zipcode.json";
    return fetch(url)
        .then(function (res) {
            return res.json();
        })
        .then(function (data) {
            dataInitTocbbCity(data);
            dataChangeTocbbArea(data);
            zipCode = data;
            return data;
        })
        .catch(function (err) {
            console.log(err);
        });
}
//抓取GOGORO API
function moveToArea() {
    let citySelect = document.querySelector('#city').selectedOptions[0].innerHTML;
    let areaSelect = document.querySelector('#area').value
    if (citySelect == '全部' && areaSelect == 'all') {
        map.flyTo([locations.latitude, locations.longitude], 13);
    }
    else //if(areaSelect!='全部')
    {
        let loc;
        if (areaSelect != 'all') {
            loc = zipCode.filter(function (elem) {
                return elem.ZIPCODE == areaSelect;
            });
        }
        else {
            loc = zipCode.filter(function (elem) {
                return elem.COUNTYNAME == citySelect;
            });
        }
        map.flyTo([loc[0].CENTERLATITUDE, loc[0].CENTERLONGITUDE], 14);
    }
}
function getGOGOROData(initRun) {

    removeAllRemarkers();

    let url = 'https://wapi.gogoro.com/tw/api/vm/list/';
    fetch(url)
        .then(function (res) {
            return res.json();
        })
        .then(function (data) {
            allStationInformation=data.data;
            
            addMarkerToMap(allStationInformation);
            
            moveToArea();
            
            countStation(chooseData);
            
            return data;
        })
        .catch(function (err) {
            console.log(err);
        });
};

function findGogoroStation()
{
    removeAllRemarkers();
    let citySelect = document.querySelector('#city').selectedOptions[0].innerHTML;
    let areaSelect = document.querySelector('#area').value
    let chooseData;
    if (citySelect == '全部' && areaSelect == 'all') {
        chooseData=allStationInformation;
    }
    else if(areaSelect == 'all')
    {
        chooseData=allStationInformation.filter(function(elem){
            return JSON.parse(elem.City).List[1].Value==citySelect;
        });
    }
    else
    {
        chooseData=allStationInformation.filter(function(elem){
            return elem.ZipCode.substring(0,3)==areaSelect;
        });
    }
    
    addMarkerToMap(chooseData);

    moveToArea();

    countStation(chooseData);
}

function addMarkerToMap(chooseData){
    chooseData.map(function (elem, idx) {
        var tmpmarker = addMarkerAndBindPopup(JSON.parse(elem.LocName).List[1].Value, elem.Latitude, elem.Longitude);
        marker.push(tmpmarker);
    });
}

function countStation(chooseData)
{
    document.querySelector('#stationcount').innerHTML=`(${chooseData.length})`;
}