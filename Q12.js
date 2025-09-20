// Sử dụng d3.csv để tải dữ liệu, toàn bộ code gốc được đưa vào trong .then()
d3.csv("data.csv").then(function (data) {

    // Bắt đầu code gốc, thay "window.data" bằng "data"
    if (typeof data === "undefined" || !Array.isArray(data) || data.length === 0) {
        console.error("Dữ liệu chưa được load hoặc rỗng!");
        return;
    }

    console.log("Dữ liệu đã load:", data);

    const margin = { top: 40, right: 40, bottom: 80, left: 50 },
        width = 900,
        height = 300;

    const data12 = data.map(d => ({
        "Mã khách hàng": d["Mã khách hàng"],
        "Thành tiền": parseFloat(d["Thành tiền"]) || 0
    }));
    
    const chitieukh = Array.from(
        d3.rollup(data12,
            v => d3.sum(v, d => d["Thành tiền"]),
            d => d["Mã khách hàng"]
        ),
        ([key, value]) => ({ "Mã khách hàng": key, "Chi tiêu KH": value })
    );

    const binsize = 50000;
    let binneddata = Array.from(
        d3.rollup(chitieukh,
            v => v.length,
            d => Math.floor(d["Chi tiêu KH"] / binsize) * binsize
        ),
        ([key, value]) => ({
            "Khoảng chi tiêu": `Từ ${key} đến ${key + binsize}`,
            "Số lượng KH": value,
            "Chi tiêu KH": key
        })
    );

    if (binneddata.length > 0) {
        binneddata.sort((a, b) => a["Chi tiêu KH"] - b["Chi tiêu KH"]);
    }

    const svg = d3.select("#Q12")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(binneddata.map(d => `${d["Chi tiêu KH"] / 1000}K`))
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(binneddata, d => d["Số lượng KH"]) || 1600])
        .range([height, 0]);

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "10px")
        .style("pointer-events", "none")
        .style("text-align", "left");

    const bars = chart.selectAll(".bar")
        .data(binneddata)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(`${d["Chi tiêu KH"] / 1000}K`))
        .attr("y", d => y(d["Số lượng KH"]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d["Số lượng KH"]))
        .attr("fill", "steelblue")
        .on("mouseover", function (event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`
                <p><strong>Đã chi tiêu ${d["Khoảng chi tiêu"]}</strong></p>
                <p><strong>Số lượng KH:</strong> ${d["Số lượng KH"].toLocaleString()}</p>
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
            if (d3.select(this).attr("opacity") !== "0.3") {
                bars.attr("opacity", 0.3);
                d3.select(this).attr("opacity", 1);
            } else {
                bars.attr("opacity", 1);
            }
        });
 
    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .style("font-size", "11px")
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-0.8em")
        .attr("dy", "0.15em")
        .attr("transform", "rotate(-90)");

    chart.append("g")
        .call(d3.axisLeft(y).ticks(16))
        .style("font-size", "11px");
        
}).catch(function(error) {
    console.error("Lỗi khi tải file data.csv cho Q12:", error);
});