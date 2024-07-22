// Load the CSV file
d3.csv("project_data.csv").then(data => {
    console.log("Data loaded successfully:", data);
    createRegionFilterControls(data);
    createIndicatorButtons(data);
  }).catch(error => {
    console.error("Error loading data:", error);
  });
  
  // Function to create region filter controls
  function createRegionFilterControls(data) {
    const container = d3.select("#region-filter");
  
    // Create region checkboxes
    const regions = Array.from(new Set(data.map(d => d.Region)));
  
    container.selectAll("div")
      .data(regions)
      .enter()
      .append("div")
      .attr("class", "region-checkbox")
      .attr("data-label", d => d)
      .append("label")
      .each(function(d) {
        d3.select(this).append("input")
          .attr("type", "checkbox")
          .attr("value", d)
          .attr("name", "region")
          .on("change", () => updateCountryFilterControls(data));
        d3.select(this).append("span")
          .text(d);
      });
  }
  
  // Function to update country filter controls based on selected regions
  function updateCountryFilterControls(data) {
    const selectedRegions = Array.from(d3.selectAll("input[name='region']:checked").nodes(), input => input.value);
    const filteredCountries = data.filter(d => selectedRegions.includes(d.Region));
    const countries = Array.from(new Set(filteredCountries.map(d => d["Country Name"])));
  
    const container = d3.select("#country-filter").html("");
  
    container.selectAll("div")
      .data(countries)
      .enter()
      .append("div")
      .attr("class", "country-checkbox")
      .attr("data-label", d => d)
      .append("label")
      .each(function(d) {
        d3.select(this).append("input")
          .attr("type", "checkbox")
          .attr("value", d)
          .attr("name", "country");
        d3.select(this).append("span")
          .text(d);
      });
  }
  
  // Function to create indicator buttons
  function createIndicatorButtons(data) {
    const container = d3.select("#indicator-buttons");
  
    // Define the indicators
    const indicators = [
      "Adjusted savings: education expenditure (current US$)",
      "Current health expenditure per capita (current US$)",
      "GDP per capita (current US$)",
      "Imports of goods and services (BoP, current US$)",
      "Individuals using the Internet (% of population)",
      "Life Expectancy",
      "Mobile cellular subscriptions (per 100 people)",
      "People using safely managed drinking water services (% of population)",
      "Renewable energy consumption (% of total final energy consumption)",
      "Total Population",
      "Unemployment, total (% of total labor force) (national estimate)"
    ];
  
    container.selectAll("button")
      .data(indicators)
      .enter()
      .append("button")
      .attr("class", "indicator-button")
      .text(d => d)
      .on("click", (event, indicator) => filterData(data, indicator));
  }
  
  // Function to filter data based on selected checkboxes and indicator
  function filterData(data, indicator) {
    const selectedRegions = Array.from(d3.selectAll("input[name='region']:checked").nodes(), input => input.value);
    const selectedCountries = Array.from(d3.selectAll("input[name='country']:checked").nodes(), input => input.value);
  
    const filteredData = data.filter(d => 
      selectedRegions.includes(d.Region) && 
      selectedCountries.includes(d["Country Name"])
    );
  
    // Clear previous plot
    d3.select("#plot-container").html("");
  
    // Display the filtered data in a plot
    createPlot(filteredData, indicator);
  }
  
  // Function to create and display the plot
  function createPlot(data, indicator) {
    const container = d3.select("#plot-container");
    const margin = {top: 20, right: 140, bottom: 60, left: 80}; // Increased left margin to accommodate y-axis label
    const width = container.node().clientWidth - margin.left - margin.right;
    const height = container.node().clientHeight - margin.top - margin.bottom;
  
    const svg = container.append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    const color = d3.scaleOrdinal(d3.schemeCategory10);
  
    // Filter out data points where the indicator is 0 or null
    const filteredData = data.filter(d => d[indicator] != 0 && d[indicator] != null);
  
    const x = d3.scaleTime()
      .domain(d3.extent(filteredData, d => new Date(d.Year)))
      .range([0, width]);
  
    const y = d3.scaleLinear()
      .domain([0, d3.max(filteredData, d => +d[indicator])])
      .nice()
      .range([height, 0]);
  
    const xAxis = svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5));
  
    const yAxis = svg.append("g")
      .call(d3.axisLeft(y));
  
    // Add title and labels
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text(indicator);
  
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + 50)
      .attr("text-anchor", "middle")
      .text("Year");
  
    svg.append("text")
      .attr("x", -height / 2)
      .attr("y", -60)
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .text(indicator);
  
    // Group data by country
    const dataByCountry = d3.groups(filteredData, d => d["Country Name"]);
  
    // Create a tooltip element
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip");
  
    dataByCountry.forEach(([country, values], index) => {
      const line = d3.line()
        .x(d => x(new Date(d.Year)))
        .y(d => y(+d[indicator]));
  
      const path = svg.append("path")
        .datum(values)
        .attr("fill", "none")
        .attr("stroke", color(country))
        .attr("stroke-width", 1.5)
        .attr("d", line);
  
      // Add animation
      const totalLength = path.node().getTotalLength();
  
      path
        .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);
  
      // Add circles for data points
      svg.selectAll(`.data-point-${country.replace(/\s+/g, '-')}`)
        .data(values)
        .enter()
        .append("circle")
        .attr("class", `data-point-${country.replace(/\s+/g, '-')}`)
        .attr("cx", d => x(new Date(d.Year)))
        .attr("cy", d => y(+d[indicator]))
        .attr("r", 5)
        .attr("fill", color(country))
        .on("mouseover", (event, d) => {
          tooltip.transition().duration(200).style("opacity", 1);
          tooltip.html(`Country: ${d["Country Name"]}<br>Year: ${d.Year}<br>${indicator}: ${d[indicator]}`)
            .style("left", `${event.pageX + 5}px`)
            .style("top", `${event.pageY - 28}px`);
        })
        .on("mouseout", () => {
          tooltip.transition().duration(500).style("opacity", 0);
        });
    });
  
    xAxis.transition()
      .duration(2000)
      .call(d3.axisBottom(x).ticks(5));
  
    yAxis.transition()
      .duration(2000)
      .call(d3.axisLeft(y));
  
    // Add legend
    const legend = svg.selectAll(".legend")
      .data(dataByCountry)
      .enter().append("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => `translate(0,${i * 20})`);
  
    legend.append("rect")
      .attr("x", width + 5)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", d => color(d[0]));
  
    legend.append("text")
      .attr("x", width + 25)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "start")
      .text(d => d[0]);
  }
  