let historyEl = document.getElementById("menu-history");
let statEl = document.getElementById("menu-stat");

let subMenuEl = document.getElementById("menu-second");
let todayEl = document.getElementById("menu-today");
let lastWeekEl = document.getElementById("menu-last-week");
let allTimeEl = document.getElementById("menu-all-time");
let contentEl = document.getElementById("content");
let settingsEl = document.getElementById("settings");

historyEl.addEventListener("click", async () => {
    drawHistoryLastDay();
    subMenuEl.style.display = 'none';
    activateTopMenuBtn(historyEl);
});

statEl.addEventListener("click", async () => {
    subMenuEl.style.display = 'flex';
    activateTopMenuBtn(statEl);
    activateSubMenuBtn(todayEl);
    drawUsageStatToday();
});

settingsEl.addEventListener("click", async () => {
    openSettingsPage();
});

todayEl.addEventListener("click", async () => {
    drawUsageStatToday();
});

lastWeekEl.addEventListener("click", async () => {
    drawUsageStatLastWeek();
});

allTimeEl.addEventListener("click", async () => {
    drawUsageStatistics();
    activateSubMenuBtn(allTimeEl);
});

activateTopMenuBtn(statEl);
drawUsageStatToday();

function drawHistoryLastDay() {
    let currentDate = new Date();
    let lastWeek = new Date(currentDate.setDate(currentDate.getDate() - 1));
    drawHistory(lastWeek);
    activateSubMenuBtn(lastWeekEl);
}

function drawUsageStatLastWeek() {
    let currentDate = new Date();
    let lastWeek = new Date(currentDate.setDate(currentDate.getDate() - 7));
    drawUsageStatistics(lastWeek);
    activateSubMenuBtn(lastWeekEl);
}

function drawUsageStatToday() {
    drawUsageStatistics(new Date().setHours(0, 0, 0, 0));
    activateSubMenuBtn(todayEl);
}

function drawHistory(since) {
    contentEl.innerHTML = "";
    chrome.storage.local.get(["lastOnline", "log"], ({lastOnline, log}) => {
        let sinceDate = since || new Date().setHours(0, 0, 0, 0);

        let table = document.createElement("table");
        contentEl.appendChild(table);

        let arr = (log || []);

        for (let i = arr.length - 1; i >= 0; i--) {

            let entry = arr[i]
            let date = entry[1];
            let host = entry[0];

            if (date < sinceDate) {
                break;
            }
            let tr = document.createElement("tr");
            tr.classList.add('row');

            let td1 = document.createElement("td");
            let td2 = document.createElement("td");
            tr.appendChild(td1)
            tr.appendChild(td2)
            table.appendChild(tr)

            td1.innerText = dateToTime(date);
            td1.classList.add('text-center');
            td1.classList.add('tr-min-width');

            td2.innerText = host;
            td2.classList.add('text-left');
        }
    });
}

function drawUsageStatistics(sinceDate) {
    contentEl.innerHTML = "";
    chrome.storage.local.get(["lastOnline", "log"], ({lastOnline, log}) => {
        contentEl.innerHTML = "";

        let header = document.createElement("div");
        contentEl.appendChild(header);
        header.classList.add('content-header');

        let table = document.createElement("table");
        contentEl.appendChild(table);

        let toTime = new Date();
        let stat = getUsageStat(log, sinceDate, toTime)
        let arr = stat ? Object.entries(stat).sort((a, b) => {
            return a[1] - b[1]
        }) : [];

        // uncomment not to display inactive
        // arr = arr.filter(it => it[0] !== 'inactive')

        if (!arr.length) return;

        let totalMillis = arr.reduce((total, item) => total + (item[0] === 'inactive' ? 0 : item[1]), 0)

        // get 1st if not inactive, else 2nd.  Reasoning:
        // For most users inactive time will be larger than time on a particular website,
        // so time spent on websites will be compared to inactive time.
        // It's more interesting to compare time on different websites than website vs inactive time.
        const shiftMaxItemPosition = arr[arr.length - 1][0] === 'inactive' && arr.length > 1
        let maxTime = arr[arr.length - (shiftMaxItemPosition ? 2 : 1)][1]

        // add since row
        let firstDate = log && log[0] && log[0][1] && new Date(log[0][1]);

        let sinceTime = sinceDate && firstDate
            ? new Date(Math.max(sinceDate, firstDate))
            : sinceDate || firstDate

        header.innerText = 'Since: ' + sinceTime ? sinceTime.toLocaleString() : 'the Big Bang';

        for (let i = arr.length - 1; i >= 0; i--) {

            let entry = arr[i]
            let time = entry[1];
            let host = entry[0];
            let usagePercent = Math.round(time / totalMillis * 100 * 100) / 100;

            let tr = document.createElement("tr");
            tr.classList.add('row');

            let td1 = document.createElement("td");
            let td2 = document.createElement("td");
            tr.appendChild(td1)
            tr.appendChild(td2)
            table.appendChild(tr)

            td1.innerText = host;
            td1.title = host;
            td1.classList.add('text-left');
            td2.innerText = msToTime(time) + ' (' + usagePercent + '%)';
            td2.title = msToTime(time) + ' (' + usagePercent + '%)';
            td1.classList.add('text-left');

            let timePercentageToMax = Math.floor((time / maxTime) * 100);

            tr.style = `background:  linear-gradient(90deg, rgba(0,0,0,0) ${timePercentageToMax}%, white ${timePercentageToMax}%), linear-gradient(90deg, cyan, pink);`;
        }
    });
}

function msToTime(duration) {
    let ss = Math.floor((duration / 1000) % 60),
        mm = Math.floor((duration / (1000 * 60)) % 60),
        hh = Math.floor(duration / (1000 * 60 * 60));

    return (hh ? hh + 'h ' : '') + (mm ? mm + 'm ' : '') + (hh ? '' : ss + 's');
}

let dateToTime = function (timestamp) {
    let date = new Date(timestamp);
    let hh = date.getHours();
    let mm = date.getMinutes();
    let ss = date.getSeconds();
    return [
        (hh > 9 ? '' : '0') + hh,
        (mm > 9 ? '' : '0') + mm,
        (ss > 9 ? '' : '0') + ss
    ].join(':');
};

function activateSubMenuBtn(el) {
    let slides = document.getElementsByClassName("menu-tab-second");
    for (let i = 0; i < slides.length; i++) {
        slides[i].style = "";
    }

    el.style = "background-image: linear-gradient(to top, #ff3155, rgba(0,0,0,0) 30%);";
}

function activateTopMenuBtn(el) {
    let slides = document.getElementsByClassName("menu-tab-top");
    for (let i = 0; i < slides.length; i++) {
        slides[i].style = "";
    }

    el.style = "background-image: linear-gradient(to bottom, cyan, rgba(0,0,0,0) 30%);";
}

function getUsageStat(data, since, to) {
    let stat = {}
    if (!data) return stat;
    let prevTime = to;
    for (let i = data.length - 1; i >= 0; i--) {
        let item = data[i];
        let name = item[0];
        let itemTime = item[1];
        if (since && itemTime < since) {
            // append time for action that started before Since and finished after Since
            // in that case count only part that continued after Since timestamp
            stat[name] = (stat[name] || 0) + (prevTime - since)
            break;
        }
        stat[name] = (stat[name] || 0) + (prevTime - itemTime)
        prevTime = itemTime;
    }
    return stat;
}

function openSettingsPage() {
    chrome.tabs.create({'url': 'chrome://extensions/?options=' + chrome.runtime.id});
}
