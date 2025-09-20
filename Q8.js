// Sử dụng d3.csv để tải dữ liệu, toàn bộ code gốc được đưa vào trong .then()
d3.csv("data.csv").then(function (data) {

    // Bắt đầu code gốc, thay "window.data" bằng "data"
    if (typeof data === "undefined" || !Array.isArray(data) || data.length === 0) {
        console.error("Dữ liệu chưa được load hoặc rỗng!");
        return;
    }

    console.log("Dữ liệu đã load:", data);

    const margin = { top: 40, right: 200, bottom: 100, left: 200 },
        width = 900, height = 400;

    const data8 = data.map(d => ({
        "Mã đơn hàng": d["Mã đơn hàng"],
        "Nhóm hàng": `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`,
        "Thành tiền": parseFloat(d["Thành tiền"]) || 0,
        "SL": parseFloat(d["SL"]) || 0,
        "Tháng tạo đơn": `Tháng ${new Date(d["Thời gian tạo đơn"]).toLocaleString('default', { month: '2-digit' })}`
    }));

    const totalordersmonth = data8.reduce((acc, item) => {
        const month = item["Tháng tạo đơn"];
        if (!acc[month]) {
            acc[month] = new Set();
        }
        acc[month].add(item["Mã đơn hàng"]);
        return acc;
    }, {});

    const dataq8 = data8.reduce((acc, item) => {
        const month = item["Tháng tạo đơn"];
        const group = item["Nhóm hàng"];
        const key = `${month}|${group}`;

        if (!acc[key]) {
            acc[key] = {
                "Tháng": month,
                "Nhóm hàng": group,
                "Mã đơn hàng": new Set(),
                "SL": 0
            };
        }
        acc[key]["Mã đơn hàng"].add(item["Mã đơn hàng"]);
        acc[key]["SL"] += item["SL"];
        return acc;
    }, {});

    const finalData = Object.values(dataq8).map(d => {
        const uniqueorders = d["Mã đơn hàng"].size;
        const totalorders = totalordersmonth[d["Tháng"]].size;
        d["Xác suất bán"] = (uniqueorders / totalorders) * 100;
        d["SL Đơn Bán"] = uniqueorders;
        return d;
    });

    const svg = d3.select("#Q8")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);


    const x = d3.scaleBand()
        .domain(["Tháng 01", "Tháng 02", "Tháng 03", "Tháng 04", "Tháng 05", "Tháng 06", "Tháng 07", "Tháng 08", "Tháng 09", "Tháng 10", "Tháng 11", "Tháng 12"])
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([20, 70])
        .range([height, 0]);

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);
    
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "10px")
        .style("pointer-events", "none")
        .style("text-align", "left");

    const groupedData = d3.groups(finalData, d => d["Nhóm hàng"]);

    const line = d3.line()
        .x(d => x(d["Tháng"]) + x.bandwidth() / 2)
        .y(d => y(d["Xác suất bán"]));


    const lines = chart.selectAll(".line")
        .data(groupedData)
        .enter()
        .append("path")
        .attr("class", "line")
        .attr("d", d => line(d[1]))
        .attr("stroke", d => colorScale(d[0]))
        .attr("fill", "none")
        .attr("stroke-width", 2)
        .on("mouseover", function (event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`<p><strong>Nhóm hàng: ${d[0]}</strong></p>`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px")
                .style("font-size", "11px");
        })
        .on("mouseout", function () {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .on("click", function (event, d) {
            const isActive = d3.select(this).attr("stroke-width") === "4";
            if (isActive) {
                lines.attr("stroke-width", 2).attr("opacity", 1);
                markers.attr("r", 4).attr("opacity", 1);
            } else {
                lines.attr("stroke-width", 2).attr("opacity", 0.3);
                markers.attr("r", 4).attr("opacity", 0.3);
                d3.select(this).attr("stroke-width", 4).attr("opacity", 1);
                markers.filter(m => m["Nhóm hàng"] === d[0]).attr("r", 6).attr("opacity", 1);
            }
        });

    const markers = chart.selectAll(".marker")
        .data(finalData)
        .enter()
        .append("circle")
        .attr("class", "marker")
        .attr("cx", d => x(d["Tháng"]) + x.bandwidth() / 2)
        .attr("cy", d => y(d["Xác suất bán"]))
        .attr("r", 4)
        .attr("fill", d => colorScale(d["Nhóm hàng"]))
        .on("mouseover", function (event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`
                <p><strong>${d["Tháng"]}</strong></p>
                <p><strong>Nhóm hàng: ${d["Nhóm hàng"]}</strong></p>
                <p><strong>SL Đơn Bán:</strong> ${d["SL Đơn Bán"].toLocaleString()}</p>
                <p><strong>Xác suất Bán:</strong> ${d["Xác suất bán"].toFixed(1)}%</p>
            `)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px")
                .style("font-size", "11px");
        })
        .on("mouseout", function () {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .on("click", function (event, d) {
            const isActive = d3.select(this).attr("r") === "6";
            if (isActive) {
                lines.attr("stroke-width", 2).attr("opacity", 1);
                markers.attr("r", 4).attr("opacity", 1);
            } else {
                lines.attr("stroke-width", 2).attr("opacity", 0.3);
                markers.attr("r", 4).attr("opacity", 0.3);
                d3.select(this).attr("r", 6).attr("opacity", 1);
                lines.filter(l => l[0] === d["Nhóm hàng"]).attr("stroke-width", 4).attr("opacity", 1);
            }
        });


    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .style("font-size", "11px");


    chart.append("g")
        .call(d3.axisLeft(y)
            .tickFormat(d => `${d}%`)
            .ticks(10)
        )
        .style("font-size", "11px");


    const filter = svg.append("g")
        .attr("transform", `translate(${width + margin.left + 30},${margin.top})`);


    const filterRects = filter.selectAll("rect")
        .data(colorScale.domain())
        .enter()
        .append("rect")
        .attr("y", (d, i) => i * 20)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", colorScale)
        .on("click", function (event, selectedGroup) {
            const isActive = d3.select(this).attr("opacity") === "0.3";
            if (isActive) {
                lines.attr("stroke-width", 2).attr("opacity", 1);
                markers.attr("r", 4).attr("opacity", 1);
                filterRects.attr("opacity", 1);
            } else {
                lines.attr("stroke-width", 2).attr("opacity", 0.3);
                markers.attr("r", 4).attr("opacity", 0.3);
                lines.filter(l => l[0] === selectedGroup).attr("stroke-width", 4).attr("opacity", 1);
                markers.filter(m => m["Nhóm hàng"] === selectedGroup).attr("r", 6).attr("opacity", 1);
                filterRects.attr("opacity", 0.3);
                d3.select(this).attr("opacity", 1);
            }
        });

    filter.selectAll("text")
        .data(colorScale.domain())
        .enter()
        .append("text")
        .attr("x", 15)
        .attr("y", (d, i) => i * 20 + 9)
        .text(d => d)
        .style("font-size", "11px");
        
}).catch(function(error) {
    console.error("Lỗi khi tải file data.csv cho Q8:", error);
});```

---

### File: `Q9.js` (Đã cập nhật)

```javascript
// Sử dụng d3.csv để tải dữ liệu, toàn bộ code gốc được đưa vào trong .then()
d3.csv("data.csv").then(function (data) {

    // Bắt đầu code gốc, thay "window.data" bằng "data"
    if (!data || !data.length || !Array.isArray(data)) {
        console.error("Dữ liệu chưa được load hoặc rỗng!");
        return;
    }

    const data9 = data.map(d => ({
        "Mã đơn hàng": d["Mã đơn hàng"],
        "Nhóm hàng": `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`,
        "Mặt hàng": `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`,
        "Thành tiền": parseFloat(d["Thành tiền"]) || 0,
        "SL": parseFloat(d["SL"]) || 0,
        "Tháng tạo đơn": `Tháng ${new Date(d["Thời gian tạo đơn"]).getMonth() + 1}`
    }));

    const tong_nhom = d3.rollup(data9, v => new Set(v.map(d => d["Mã đơn hàng"])).size, d => d["Nhóm hàng"]);
    const df_grouped = d3.rollup(data9, v => new Set(v.map(d => d["Mã đơn hàng"])).size, d => d["Nhóm hàng"], d => d["Mặt hàng"]);

    const df_result = Array.from(df_grouped).flatMap(([group, items]) =>
        Array.from(items).map(([item, count]) => ({
            "Nhóm hàng": group,
            "Mặt hàng": item,
            "don_hang_mat_hang": count,
            "tong_don_theo_nhom": tong_nhom.get(group),
            "Xác suất bán": count / tong_nhom.get(group)
        }))
    );

    df_result.sort((a, b) => b["Xác suất bán"] - a["Xác suất bán"]);
    
    const groupedData = d3.groups(df_result, d => d["Nhóm hàng"]);
    const orderedGroups = ["[BOT] Bột", "[SET] Set trà", "[THO] Trà hoa", "[TMX] Trà mix", "[TTC] Trà củ, quả sấy"];
    const sortedGroupedData = orderedGroups.map(group => groupedData.find(g => g[0] === group)).filter(Boolean);

    const margin = { top: 30, right: 20, bottom: 40, left: 120 },
          width = 450 - margin.left - margin.right,
          height = 250 - margin.top - margin.bottom;

    const chartContainer = d3.select("#Q9");
    chartContainer.html("");
    chartContainer
        .style("display", "grid")
        .style("grid-template-columns", "repeat(3, 1fr)")
        .style("gap", "20px");

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "rgba(255, 255, 255, 0.95)")
        .style("border", "1px solid #ccc")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("pointer-events", "none")
        .style("text-align", "left")
        .style("font-size", "12px");
        
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    sortedGroupedData.forEach(([group, data]) => {
        const div = chartContainer.append("div")
            .style("border", "1px solid #eee")
            .style("padding-bottom", "10px");

        div.append("h3")
            .text(group)
            .style("text-align", "center")
            .style("font-size", "14px")
            .style("margin", "10px 0");

        const svg = div.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear()
            .domain([0, d3.max(data, d => d["Xác suất bán"]) * 1.05])
            .range([0, width]);

        const y = d3.scaleBand()
            .domain(data.map(d => d["Mặt hàng"]))
            .range([0, height])
            .padding(0.2);

        chart.append("g")
            .call(d3.axisLeft(y))
            .selectAll("text")
            .style("font-size", "10px")
            .style("text-anchor", "end");

        chart.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d3.format(".0%")).ticks(5))
            .style("font-size", "10px");

        const bars = chart.selectAll(".bar")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("y", d => y(d["Mặt hàng"]))
            .attr("width", d => x(d["Xác suất bán"]))
            .attr("height", y.bandwidth())
            .attr("fill", d => colorScale(d["Mặt hàng"]))
            .on("mouseover", function (event, d) {
                tooltip.transition().duration(200).style("opacity", .95);
                tooltip.html(`
                    <strong>Mặt hàng:</strong> ${d["Mặt hàng"]}<br>
                    <strong>Nhóm hàng:</strong> ${d["Nhóm hàng"]}<br>
                    <strong>SL Đơn Bán:</strong> ${d["don_hang_mat_hang"].toLocaleString()}<br>
                    <strong>Xác suất Bán / Nhóm:</strong> ${(d["Xác suất bán"] * 100).toFixed(1)}%
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function () {
                tooltip.transition().duration(500).style("opacity", 0);
            })
            .on("click", function (event, d) {
                const isActive = d3.select(this).classed("active");
                bars.style("opacity", 1).classed("active", false);
                if (!isActive) {
                    bars.style("opacity", 0.3);
                    d3.select(this).style("opacity", 1).classed("active", true);
                }
            });
            
        chart.selectAll(".label")
            .data(data)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => x(d["Xác suất bán"]) - 5)
            .attr("y", d => y(d["Mặt hàng"]) + y.bandwidth() / 2)
            .attr("dy", ".35em")
            .text(d => `${(d["Xác suất bán"] * 100).toFixed(1)}%`)
            .style("font-size", "10px")
            .style("fill", "white")
            .style("text-anchor", "end");
    });

}).catch(function(error) {
    console.error("Lỗi khi tải file data.csv cho Q9:", error);
});