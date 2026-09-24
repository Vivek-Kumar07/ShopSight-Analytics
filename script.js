/* =====================================================
   SHOPKART - E-COMMERCE SALES ANALYTICS
   Dynamic CSV Dashboard
===================================================== */


/* =====================================================
   GLOBAL VARIABLES
===================================================== */

let originalData = [];
let filteredData = [];

let revenueChart = null;
let categoryChart = null;
let cityChart = null;
let productChart = null;


/* =====================================================
   DOM ELEMENTS
===================================================== */

const csvFile = document.getElementById("csvFile");
const fileName = document.getElementById("fileName");
const uploadStatus = document.getElementById("uploadStatus");

const categoryFilter = document.getElementById("categoryFilter");
const cityFilter = document.getElementById("cityFilter");
const monthFilter = document.getElementById("monthFilter");

const resetFilters = document.getElementById("resetFilters");

const totalRevenue = document.getElementById("totalRevenue");
const totalOrders = document.getElementById("totalOrders");
const totalQuantity = document.getElementById("totalQuantity");
const averageOrderValue = document.getElementById("averageOrderValue");

const summaryText = document.getElementById("summaryText");

const orderTableBody = document.getElementById("orderTableBody");

const exportCSV = document.getElementById("exportCSV");
const exportPDF = document.getElementById("exportPDF");

const themeBtn = document.getElementById("themeBtn");
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");


/* =====================================================
   CSV FILE UPLOAD
===================================================== */

csvFile.addEventListener("change", function (event) {

    const file = event.target.files[0];

    if (!file) {
        return;
    }

    fileName.textContent = file.name;

    uploadStatus.textContent = "Reading CSV file...";

    uploadStatus.style.color = "#2563eb";

    Papa.parse(file, {

        header: true,

        skipEmptyLines: true,

        dynamicTyping: false,

        complete: function (results) {

            if (!results.data || results.data.length === 0) {

                uploadStatus.textContent =
                    "❌ The CSV file is empty.";

                uploadStatus.style.color = "#dc2626";

                return;
            }

            processCSVData(results.data);

        },

        error: function (error) {

            console.error(error);

            uploadStatus.textContent =
                "❌ Unable to read the CSV file.";

            uploadStatus.style.color = "#dc2626";
        }

    });

});


/* =====================================================
   PROCESS CSV DATA
===================================================== */

function processCSVData(data) {

    try {

        originalData = data
            .map(row => {

                const cleanRow = {};

                Object.keys(row).forEach(key => {

                    const cleanKey =
                        key.replace(/^\uFEFF/, "").trim();

                    cleanRow[cleanKey] =
                        row[key] === null ||
                        row[key] === undefined
                            ? ""
                            : String(row[key]).trim();

                });

                return cleanRow;

            })
            .filter(row => Object.values(row).some(value => value !== ""));


        if (originalData.length === 0) {

            uploadStatus.textContent =
                "❌ No usable data found.";

            uploadStatus.style.color = "#dc2626";

            return;
        }


        /* Detect columns */

        const columns = Object.keys(originalData[0]);

        console.log("Detected columns:", columns);


        /* Prepare data */

        originalData = originalData.map(row => {

            const newRow = { ...row };


            /* Revenue */

            const revenueColumn = findColumn(
                columns,
                [
                    "revenue",
                    "sales",
                    "sale",
                    "amount",
                    "total",
                    "total sales",
                    "total revenue"
                ]
            );

            newRow.__revenue =
                revenueColumn
                    ? parseNumber(row[revenueColumn])
                    : calculateRevenue(row);


            /* Quantity */

            const quantityColumn = findColumn(
                columns,
                [
                    "quantity",
                    "qty",
                    "units",
                    "units sold"
                ]
            );

            newRow.__quantity =
                quantityColumn
                    ? parseNumber(row[quantityColumn])
                    : 1;


            /* Price */

            const priceColumn = findColumn(
                columns,
                [
                    "price",
                    "unit price",
                    "unit_price",
                    "cost"
                ]
            );

            newRow.__price =
                priceColumn
                    ? parseNumber(row[priceColumn])
                    : 0;


            /* Category */

            const categoryColumn = findColumn(
                columns,
                [
                    "category",
                    "product category",
                    "product_category"
                ]
            );

            newRow.__category =
                categoryColumn
                    ? row[categoryColumn]
                    : "Unknown";


            /* City */

            const cityColumn = findColumn(
                columns,
                [
                    "city",
                    "location",
                    "region"
                ]
            );

            newRow.__city =
                cityColumn
                    ? row[cityColumn]
                    : "Unknown";


            /* Product */

            const productColumn = findColumn(
                columns,
                [
                    "product",
                    "product name",
                    "product_name",
                    "item"
                ]
            );

            newRow.__product =
                productColumn
                    ? row[productColumn]
                    : "Unknown";


            /* Order ID */

            const orderColumn = findColumn(
                columns,
                [
                    "orderid",
                    "order id",
                    "order_id",
                    "id"
                ]
            );

            newRow.__orderId =
                orderColumn
                    ? row[orderColumn]
                    : "";


            /* Date */

            const dateColumn = findColumn(
                columns,
                [
                    "date",
                    "order date",
                    "order_date",
                    "sale date"
                ]
            );

            newRow.__date =
                dateColumn
                    ? row[dateColumn]
                    : "";


            newRow.__parsedDate =
                parseDate(newRow.__date);


            return newRow;

        });


        /* Initialize filters */

        createFilters();


        /* Display dashboard */

        applyFilters();


        /* Success */

        uploadStatus.textContent =
            `✅ Dataset loaded successfully — ${originalData.length.toLocaleString()} rows analyzed.`;

        uploadStatus.style.color = "#16a34a";


    } catch (error) {

        console.error(error);

        uploadStatus.textContent =
            "❌ Error processing the CSV file.";

        uploadStatus.style.color = "#dc2626";
    }

}


/* =====================================================
   FIND COLUMN
===================================================== */

function findColumn(columns, possibleNames) {

    const normalizedColumns =
        columns.map(column => ({
            original: column,
            normalized: normalizeText(column)
        }));


    for (const name of possibleNames) {

        const normalizedName =
            normalizeText(name);


        const match =
            normalizedColumns.find(
                column => column.normalized === normalizedName
            );


        if (match) {
            return match.original;
        }

    }


    /* Partial match */

    for (const name of possibleNames) {

        const normalizedName =
            normalizeText(name);


        const match =
            normalizedColumns.find(
                column =>
                    column.normalized.includes(normalizedName) ||
                    normalizedName.includes(column.normalized)
            );


        if (match) {
            return match.original;
        }

    }


    return null;
}


/* =====================================================
   NORMALIZE TEXT
===================================================== */

function normalizeText(text) {

    return String(text)
        .toLowerCase()
        .trim()
        .replace(/[_-]/g, " ")
        .replace(/\s+/g, " ");

}


/* =====================================================
   PARSE NUMBER
===================================================== */

function parseNumber(value) {

    if (value === null || value === undefined) {
        return 0;
    }

    let text = String(value).trim();

    text = text
        .replace(/₹/g, "")
        .replace(/\$/g, "")
        .replace(/,/g, "")
        .replace(/%/g, "")
        .trim();


    const number = Number(text);

    return Number.isFinite(number) ? number : 0;
}


/* =====================================================
   CALCULATE REVENUE
===================================================== */

function calculateRevenue(row) {

    const columns = Object.keys(row);

    const priceColumn = findColumn(
        columns,
        [
            "price",
            "unit price",
            "unit_price",
            "cost"
        ]
    );

    const quantityColumn = findColumn(
        columns,
        [
            "quantity",
            "qty",
            "units"
        ]
    );


    const price =
        priceColumn
            ? parseNumber(row[priceColumn])
            : 0;


    const quantity =
        quantityColumn
            ? parseNumber(row[quantityColumn])
            : 1;


    return price * quantity;
}


/* =====================================================
   PARSE DATE
===================================================== */

function parseDate(value) {

    if (!value) {
        return null;
    }

    const text = String(value).trim();


    /* DD-MM-YYYY */

    let match =
        text.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);


    if (match) {

        const day = Number(match[1]);
        const month = Number(match[2]) - 1;
        const year = Number(match[3]);

        const date =
            new Date(year, month, day);

        if (!isNaN(date.getTime())) {
            return date;
        }

    }


    /* DD/MM/YYYY */

    match =
        text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);


    if (match) {

        const day = Number(match[1]);
        const month = Number(match[2]) - 1;
        const year = Number(match[3]);

        const date =
            new Date(year, month, day);

        if (!isNaN(date.getTime())) {
            return date;
        }

    }


    /* YYYY-MM-DD */

    match =
        text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);


    if (match) {

        const year = Number(match[1]);
        const month = Number(match[2]) - 1;
        const day = Number(match[3]);

        const date =
            new Date(year, month, day);

        if (!isNaN(date.getTime())) {
            return date;
        }

    }


    /* Browser fallback */

    const date = new Date(text);

    return isNaN(date.getTime())
        ? null
        : date;

}


/* =====================================================
   CREATE FILTERS
===================================================== */

function createFilters() {

    /* CATEGORY */

    categoryFilter.innerHTML =
        `<option value="all">All Categories</option>`;


    const categories =
        [...new Set(
            originalData
                .map(row => row.__category)
                .filter(Boolean)
        )]
        .sort();


    categories.forEach(category => {

        const option =
            document.createElement("option");

        option.value = category;

        option.textContent = category;

        categoryFilter.appendChild(option);

    });


    /* CITY */

    cityFilter.innerHTML =
        `<option value="all">All Cities</option>`;


    const cities =
        [...new Set(
            originalData
                .map(row => row.__city)
                .filter(Boolean)
        )]
        .sort();


    cities.forEach(city => {

        const option =
            document.createElement("option");

        option.value = city;

        option.textContent = city;

        cityFilter.appendChild(option);

    });


    /* MONTH */

    monthFilter.innerHTML =
        `<option value="all">All Months</option>`;


    const months = {};


    originalData.forEach(row => {

        if (!row.__parsedDate) {
            return;
        }


        const key =
            getMonthKey(row.__parsedDate);


        months[key] =
            formatMonth(row.__parsedDate);

    });


    Object.keys(months)
        .sort()
        .forEach(key => {

            const option =
                document.createElement("option");

            option.value = key;

            option.textContent = months[key];

            monthFilter.appendChild(option);

        });

}


/* =====================================================
   FILTER EVENTS
===================================================== */

categoryFilter.addEventListener(
    "change",
    applyFilters
);

cityFilter.addEventListener(
    "change",
    applyFilters
);

monthFilter.addEventListener(
    "change",
    applyFilters
);


/* =====================================================
   APPLY FILTERS
===================================================== */

function applyFilters() {

    if (originalData.length === 0) {
        return;
    }


    const selectedCategory =
        categoryFilter.value;


    const selectedCity =
        cityFilter.value;


    const selectedMonth =
        monthFilter.value;


    filteredData =
        originalData.filter(row => {


            const categoryMatch =
                selectedCategory === "all" ||
                row.__category === selectedCategory;


            const cityMatch =
                selectedCity === "all" ||
                row.__city === selectedCity;


            const monthMatch =
                selectedMonth === "all" ||
                (
                    row.__parsedDate &&
                    getMonthKey(row.__parsedDate) === selectedMonth
                );


            return (
                categoryMatch &&
                cityMatch &&
                monthMatch
            );

        });


    updateKPIs();

    updateCharts();

    updateTable();

    generateInsights();

}


/* =====================================================
   UPDATE KPIs
===================================================== */

function updateKPIs() {

    const revenue =
        filteredData.reduce(
            (sum, row) => sum + row.__revenue,
            0
        );


    const quantity =
        filteredData.reduce(
            (sum, row) => sum + row.__quantity,
            0
        );


    const orders =
        filteredData.length;


    const average =
        orders > 0
            ? revenue / orders
            : 0;


    totalRevenue.textContent =
        formatCurrency(revenue);


    totalOrders.textContent =
        orders.toLocaleString();


    totalQuantity.textContent =
        quantity.toLocaleString();


    averageOrderValue.textContent =
        formatCurrency(average);

}


/* =====================================================
   UPDATE CHARTS
===================================================== */

function updateCharts() {

    updateRevenueChart();

    updateCategoryChart();

    updateCityChart();

    updateProductChart();

}


/* =====================================================
   REVENUE CHART
===================================================== */

function updateRevenueChart() {

    const monthlyRevenue = {};


    filteredData.forEach(row => {

        if (!row.__parsedDate) {
            return;
        }


        const key =
            getMonthKey(row.__parsedDate);


        if (!monthlyRevenue[key]) {
            monthlyRevenue[key] = 0;
        }


        monthlyRevenue[key] += row.__revenue;

    });


    const labels =
        Object.keys(monthlyRevenue)
            .sort();


    const values =
        labels.map(
            key => monthlyRevenue[key]
        );


    const formattedLabels =
        labels.map(key => {

            const [year, month] =
                key.split("-");

            return new Date(
                Number(year),
                Number(month) - 1,
                1
            ).toLocaleString(
                "en-US",
                {
                    month: "short",
                    year: "numeric"
                }
            );

        });


    if (revenueChart) {
        revenueChart.destroy();
    }


    const ctx =
        document
            .getElementById("revenueChart")
            .getContext("2d");


    revenueChart =
        new Chart(ctx, {

            type: "line",

            data: {

                labels: formattedLabels,

                datasets: [

                    {
                        label: "Revenue",

                        data: values,

                        borderWidth: 3,

                        tension: 0.35,

                        fill: false,

                        pointRadius: 4
                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {
                        position: "bottom"
                    },

                    tooltip: {

                        callbacks: {

                            label: function (context) {

                                return (
                                    "Revenue: " +
                                    formatCurrency(
                                        context.raw
                                    )
                                );

                            }

                        }

                    }

                },

                scales: {

                    y: {

                        beginAtZero: true,

                        ticks: {

                            callback: function (value) {

                                return formatCompactCurrency(value);

                            }

                        }

                    }

                }

            }

        });

}


/* =====================================================
   CATEGORY CHART
===================================================== */

function updateCategoryChart() {

    const categoryRevenue = {};


    filteredData.forEach(row => {

        const category =
            row.__category || "Unknown";


        if (!categoryRevenue[category]) {
            categoryRevenue[category] = 0;
        }


        categoryRevenue[category] +=
            row.__revenue;

    });


    const labels =
        Object.keys(categoryRevenue);


    const values =
        labels.map(
            category =>
                categoryRevenue[category]
        );


    if (categoryChart) {
        categoryChart.destroy();
    }


    const ctx =
        document
            .getElementById("categoryChart")
            .getContext("2d");


    categoryChart =
        new Chart(ctx, {

            type: "doughnut",

            data: {

                labels: labels,

                datasets: [

                    {
                        label: "Revenue",

                        data: values,

                        borderWidth: 1
                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {
                        position: "bottom"
                    },

                    tooltip: {

                        callbacks: {

                            label: function (context) {

                                return (
                                    context.label +
                                    ": " +
                                    formatCurrency(
                                        context.raw
                                    )
                                );

                            }

                        }

                    }

                }

            }

        });

}


/* =====================================================
   CITY CHART
===================================================== */

function updateCityChart() {

    const cityRevenue = {};


    filteredData.forEach(row => {

        const city =
            row.__city || "Unknown";


        if (!cityRevenue[city]) {
            cityRevenue[city] = 0;
        }


        cityRevenue[city] +=
            row.__revenue;

    });


    const sorted =
        Object.entries(cityRevenue)
            .sort(
                (a, b) => b[1] - a[1]
            );


    const labels =
        sorted.map(item => item[0]);


    const values =
        sorted.map(item => item[1]);


    if (cityChart) {
        cityChart.destroy();
    }


    const ctx =
        document
            .getElementById("cityChart")
            .getContext("2d");


    cityChart =
        new Chart(ctx, {

            type: "bar",

            data: {

                labels: labels,

                datasets: [

                    {
                        label: "Revenue",

                        data: values,

                        borderWidth: 1
                    }

                ]

            },

            options: {

                indexAxis: "y",

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {
                        position: "bottom"
                    },

                    tooltip: {

                        callbacks: {

                            label: function (context) {

                                return (
                                    "Revenue: " +
                                    formatCurrency(
                                        context.raw
                                    )
                                );

                            }

                        }

                    }

                },

                scales: {

                    x: {

                        beginAtZero: true,

                        ticks: {

                            callback: function (value) {

                                return formatCompactCurrency(value);

                            }

                        }

                    }

                }

            }

        });

}


/* =====================================================
   PRODUCT CHART
===================================================== */

function updateProductChart() {

    const productRevenue = {};


    filteredData.forEach(row => {

        const product =
            row.__product || "Unknown";


        if (!productRevenue[product]) {
            productRevenue[product] = 0;
        }


        productRevenue[product] +=
            row.__revenue;

    });


    const sorted =
        Object.entries(productRevenue)
            .sort(
                (a, b) => b[1] - a[1]
            )
            .slice(0, 10);


    const labels =
        sorted.map(item => item[0]);


    const values =
        sorted.map(item => item[1]);


    if (productChart) {
        productChart.destroy();
    }


    const ctx =
        document
            .getElementById("productChart")
            .getContext("2d");


    productChart =
        new Chart(ctx, {

            type: "bar",

            data: {

                labels: labels,

                datasets: [

                    {
                        label: "Revenue",

                        data: values,

                        borderWidth: 1
                    }

                ]

            },

            options: {

                indexAxis: "y",

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {
                        position: "bottom"
                    },

                    tooltip: {

                        callbacks: {

                            label: function (context) {

                                return (
                                    "Revenue: " +
                                    formatCurrency(
                                        context.raw
                                    )
                                );

                            }

                        }

                    }

                }

            }

        });

}


/* =====================================================
   UPDATE TABLE
===================================================== */

function updateTable() {

    orderTableBody.innerHTML = "";


    if (filteredData.length === 0) {

        orderTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-table">
                    No records found for the selected filters.
                </td>
            </tr>
        `;

        return;
    }


    const displayData =
        filteredData.slice(0, 20);


    displayData.forEach(row => {

        const tr =
            document.createElement("tr");


        tr.innerHTML = `

            <td>${escapeHTML(row.__orderId)}</td>

            <td>${escapeHTML(row.__date)}</td>

            <td>${escapeHTML(row.__city)}</td>

            <td>${escapeHTML(row.__category)}</td>

            <td>${escapeHTML(row.__product)}</td>

            <td>${formatNumber(row.__quantity)}</td>

            <td>${formatCurrency(row.__price)}</td>

            <td>${formatCurrency(row.__revenue)}</td>

        `;


        orderTableBody.appendChild(tr);

    });

}


/* =====================================================
   BUSINESS INSIGHTS
===================================================== */

function generateInsights() {

    if (filteredData.length === 0) {

        summaryText.textContent =
            "No data available for the selected filters.";

        return;
    }


    const revenue =
        filteredData.reduce(
            (sum, row) =>
                sum + row.__revenue,
            0
        );


    const quantity =
        filteredData.reduce(
            (sum, row) =>
                sum + row.__quantity,
            0
        );


    const orders =
        filteredData.length;


    const average =
        revenue / orders;


    /* Top category */

    const categoryTotals = {};


    filteredData.forEach(row => {

        categoryTotals[row.__category] =
            (categoryTotals[row.__category] || 0) +
            row.__revenue;

    });


    const topCategory =
        Object.entries(categoryTotals)
            .sort(
                (a, b) => b[1] - a[1]
            )[0];


    /* Top city */

    const cityTotals = {};


    filteredData.forEach(row => {

        cityTotals[row.__city] =
            (cityTotals[row.__city] || 0) +
            row.__revenue;

    });


    const topCity =
        Object.entries(cityTotals)
            .sort(
                (a, b) => b[1] - a[1]
            )[0];


    /* Top product */

    const productTotals = {};


    filteredData.forEach(row => {

        productTotals[row.__product] =
            (productTotals[row.__product] || 0) +
            row.__revenue;

    });


    const topProduct =
        Object.entries(productTotals)
            .sort(
                (a, b) => b[1] - a[1]
            )[0];


    let insight =

        `The selected dataset contains ${orders.toLocaleString()} orders `
        + `with total revenue of ${formatCurrency(revenue)} `
        + `and ${quantity.toLocaleString()} units sold. `;


    if (topCategory) {

        insight +=
            `The highest-revenue category is `
            + `<strong>${escapeHTML(topCategory[0])}</strong> `
            + `with ${formatCurrency(topCategory[1])} in revenue. `;

    }


    if (topCity) {

        insight +=
            `The top-performing city is `
            + `<strong>${escapeHTML(topCity[0])}</strong>. `;

    }


    if (topProduct) {

        insight +=
            `The highest-revenue product is `
            + `<strong>${escapeHTML(topProduct[0])}</strong>. `;

    }


    insight +=
        `The average order value is ${formatCurrency(average)}.`;


    summaryText.innerHTML = insight;

}


/* =====================================================
   RESET FILTERS
===================================================== */

resetFilters.addEventListener(
    "click",
    function () {

        categoryFilter.value = "all";

        cityFilter.value = "all";

        monthFilter.value = "all";

        applyFilters();

    }
);


/* =====================================================
   CSV EXPORT
===================================================== */

exportCSV.addEventListener(
    "click",
    function () {

        if (filteredData.length === 0) {

            alert("Please upload a CSV file first.");

            return;
        }


        const exportData =
            filteredData.map(row => {

                const cleanRow = {};

                Object.keys(row).forEach(key => {

                    if (!key.startsWith("__")) {

                        cleanRow[key] =
                            row[key];

                    }

                });

                return cleanRow;

            });


        const csv =
            Papa.unparse(exportData);


        const blob =
            new Blob(
                [csv],
                {
                    type: "text/csv;charset=utf-8;"
                }
            );


        const url =
            URL.createObjectURL(blob);


        const link =
            document.createElement("a");


        link.href = url;

        link.download =
            "ShopKart_Filtered_Data.csv";


        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);

    }
);


/* =====================================================
   PDF EXPORT
===================================================== */

exportPDF.addEventListener(
    "click",
    async function () {

        if (filteredData.length === 0) {

            alert("Please upload a CSV file first.");

            return;
        }


        const {
            jsPDF
        } = window.jspdf;


        const doc =
            new jsPDF(
                "landscape",
                "mm",
                "a4"
            );


        /* TITLE */

        doc.setFontSize(22);

        doc.text(
            "ShopKart - E-commerce Sales Analytics",
            15,
            18
        );


        doc.setFontSize(10);

        doc.text(
            `Generated: ${new Date().toLocaleString()}`,
            15,
            26
        );


        doc.text(
            `Records analyzed: ${filteredData.length}`,
            15,
            32
        );


        /* KPIs */

        const revenue =
            filteredData.reduce(
                (sum, row) =>
                    sum + row.__revenue,
                0
            );


        const orders =
            filteredData.length;


        const quantity =
            filteredData.reduce(
                (sum, row) =>
                    sum + row.__quantity,
                0
            );


        const average =
            orders > 0
                ? revenue / orders
                : 0;


        doc.setFontSize(12);

        doc.text(
            `Total Revenue: ${formatCurrency(revenue)}`,
            15,
            42
        );


        doc.text(
            `Total Orders: ${orders}`,
            80,
            42
        );


        doc.text(
            `Quantity Sold: ${quantity}`,
            145,
            42
        );


        doc.text(
            `Average Order Value: ${formatCurrency(average)}`,
            215,
            42
        );


        /* CHARTS */

        let currentY = 50;


        addChartToPDF(
            doc,
            revenueChart,
            15,
            currentY,
            125,
            70
        );


        addChartToPDF(
            doc,
            categoryChart,
            150,
            currentY,
            125,
            70
        );


        currentY = 130;


        addChartToPDF(
            doc,
            cityChart,
            15,
            currentY,
            125,
            70
        );


        addChartToPDF(
            doc,
            productChart,
            150,
            currentY,
            125,
            70
        );


        /* NEW PAGE */

        doc.addPage();


        doc.setFontSize(16);

        doc.text(
            "Business Insights",
            15,
            18
        );


        const insightText =
            summaryText.innerText;


        const splitInsight =
            doc.splitTextToSize(
                insightText,
                265
            );


        doc.setFontSize(10);

        doc.text(
            splitInsight,
            15,
            27
        );


        /* DATA TABLE */

        const tableStart =
            45;


        const columns =
            Object.keys(
                filteredData[0]
            )
            .filter(
                key => !key.startsWith("__")
            );


        const headers =
            columns.map(
                column =>
                    String(column)
            );


        const body =
            filteredData.map(row =>

                columns.map(
                    column =>
                        row[column] ?? ""
                )

            );


        doc.autoTable({

            startY: tableStart,

            head: [headers],

            body: body,

            theme: "grid",

            styles: {

                fontSize: 7,

                cellPadding: 2

            },

            headStyles: {

                fontSize: 7

            },

            margin: {

                left: 10,

                right: 10

            },

            didDrawPage: function (data) {

                const pageNumber =
                    doc.internal.getNumberOfPages();


                doc.setFontSize(8);

                doc.text(
                    `ShopKart Analytics | Page ${pageNumber}`,
                    15,
                    200
                );

            }

        });


        /* SAVE */

        doc.save(
            "ShopKart_E-commerce_Analytics_Report.pdf"
        );

    }
);


/* =====================================================
   ADD CHART TO PDF
===================================================== */

function addChartToPDF(
    doc,
    chart,
    x,
    y,
    width,
    height
) {

    if (!chart) {
        return;
    }


    const image =
        chart.toBase64Image();


    doc.addImage(
        image,
        "PNG",
        x,
        y,
        width,
        height
    );

}


/* =====================================================
   FORMAT CURRENCY
===================================================== */

function formatCurrency(value) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    ).format(value || 0);

}


/* =====================================================
   COMPACT CURRENCY
===================================================== */

function formatCompactCurrency(value) {

    if (value >= 10000000) {

        return "₹" +
            (value / 10000000).toFixed(1) +
            "Cr";

    }


    if (value >= 100000) {

        return "₹" +
            (value / 100000).toFixed(1) +
            "L";

    }


    if (value >= 1000) {

        return "₹" +
            (value / 1000).toFixed(1) +
            "K";

    }


    return "₹" + value;

}


/* =====================================================
   FORMAT NUMBER
===================================================== */

function formatNumber(value) {

    return Number(value || 0)
        .toLocaleString("en-IN");

}


/* =====================================================
   MONTH KEY
===================================================== */

function getMonthKey(date) {

    return (
        date.getFullYear() +
        "-" +
        String(
            date.getMonth() + 1
        ).padStart(2, "0")
    );

}


/* =====================================================
   FORMAT MONTH
===================================================== */

function formatMonth(date) {

    return date.toLocaleString(
        "en-US",
        {
            month: "long",
            year: "numeric"
        }
    );

}


/* =====================================================
   HTML ESCAPE
===================================================== */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =====================================================
   DARK MODE
===================================================== */

themeBtn.addEventListener(
    "click",
    function () {

        document.body.classList.toggle("dark");


        if (
            document.body.classList.contains("dark")
        ) {

            themeBtn.textContent = "☀️";

        } else {

            themeBtn.textContent = "🌙";

        }

    }
);


/* =====================================================
   MOBILE SIDEBAR
===================================================== */

menuBtn.addEventListener(
    "click",
    function () {

        sidebar.classList.toggle("show");

    }
);


/* =====================================================
   SIDEBAR LINK CLICK
===================================================== */

document
    .querySelectorAll(".sidebar nav a")
    .forEach(link => {

        link.addEventListener(
            "click",
            function () {

                document
                    .querySelectorAll(
                        ".sidebar nav a"
                    )
                    .forEach(item =>
                        item.classList.remove(
                            "active"
                        )
                    );


                this.classList.add("active");


                sidebar.classList.remove("show");

            }
        );

    });


/* =====================================================
   INITIAL STATE
===================================================== */

summaryText.textContent =
    "Upload a CSV file to generate automatic business insights.";
