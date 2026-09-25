let treeData = null;
let currentNode = null;
let nodeMap = new Map();

const MAX_LEVEL = 5;


// =========================
// 데이터 불러오기
// =========================

fetch("tree.json")
    .then(response => response.json())
    .then(data => {
        treeData = data;

        // 모든 원본 노드를 ID로 저장
        function buildNodeMap(node) {
            if (node.id) {
                nodeMap.set(node.id, node);
            }

            if (node.children) {
                node.children.forEach(child => {
                    buildNodeMap(child);
                });
            }
        }

        buildNodeMap(treeData);

        currentNode = treeData;

        drawTree();
        updateBreadcrumb();
        updateInfo();
    })
    .catch(error => {
        console.error("tree.json 불러오기 실패:", error);
    });


// =========================
// 현재 위치에서 5단계까지만 표시
// =========================

function limitTree(node, level = 1) {

    const result = {
        ...node
    };

    // 현재 노드부터 5번째 노드까지 표시
    if (level >= MAX_LEVEL) {

        // 중요:
        // 화면에서는 하위 노드를 표시하지 않지만
        // 원본 데이터는 nodeMap에 그대로 존재함
        delete result.children;

        return result;
    }

    if (node.children && node.children.length > 0) {

        result.children = node.children.map(child => {
            return limitTree(child, level + 1);
        });

    }

    return result;
}


// =========================
// 트리 그리기
// =========================

function drawTree() {

    const container = document.getElementById("tree");

    if (!container) {
        console.error("#tree 요소를 찾을 수 없습니다.");
        return;
    }

    container.innerHTML = "";

    // 현재 노드부터 정확히 5단계
    const displayData = limitTree(currentNode, 1);

    const width = 1000;
    const height = 700;

    const svg = d3.select(container)
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const g = svg.append("g")
        .attr("transform", "translate(100, 50)");

    const root = d3.hierarchy(displayData);

    const treeLayout = d3.tree()
        .size([height - 100, width - 250]);

    treeLayout(root);


    // =========================
    // 연결선
    // =========================

    g.selectAll(".link")
        .data(root.links())
        .enter()
        .append("line")
        .attr("class", "link")
        .attr("x1", d => d.source.y)
        .attr("y1", d => d.source.x)
        .attr("x2", d => d.target.y)
        .attr("y2", d => d.target.x);


    // =========================
    // 노드
    // =========================

    const nodes = g.selectAll(".node")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("class", "node")
        .attr(
            "transform",
            d => `translate(${d.y}, ${d.x})`
        )
        .style("cursor", "pointer")
        .on("click", function(event, d) {

            // 화면에 잘린 5번째 노드도
            // 원본 데이터를 찾아서 이동할 수 있게 함
            let originalNode = d.data;

            if (d.data.id && nodeMap.has(d.data.id)) {
                originalNode = nodeMap.get(d.data.id);
            }

            selectNode(originalNode);
        });


    nodes.append("circle")
        .attr("r", 7);


    nodes.append("text")
        .attr("dx", 12)
        .attr("dy", 4)
        .text(d => d.data.name);


    // =========================
    // 줌
    // =========================

    const zoom = d3.zoom()
        .scaleExtent([0.3, 3])
        .on("zoom", event => {
            g.attr("transform", event.transform);
        });

    svg.call(zoom);
}


// =========================
// 노드 선택
// =========================

function selectNode(node) {

    if (!node) {
        return;
    }


    // 현재 위치를 기록
    history.push(currentNode);


    // 새로운 위치로 이동
    currentNode = node;


    drawTree();

    updateBreadcrumb();

    updateInfo();
}


// =========================
// 뒤로가기
// =========================

document.getElementById("back-button")?.addEventListener(
    "click",
    function() {

        if (history.length === 0) {
            return;
        }


        // 가장 최근 위치로 돌아감
        currentNode = history.pop();


        drawTree();

        updateBreadcrumb();

        updateInfo();
    }
);


// =========================
// Breadcrumb
// =========================

function updateBreadcrumb() {

    const breadcrumb =
        document.getElementById("breadcrumb");

    if (!breadcrumb) {
        return;
    }

    const path = [];

    let node = currentNode;

    while (node) {

        path.unshift(node);

        node = node.parent;
    }

    breadcrumb.innerHTML = "";

    path.forEach((node, index) => {

        const span =
            document.createElement("span");

        span.textContent = node.name;

        span.style.cursor = "pointer";

        span.addEventListener(
            "click",
            () => {
                selectNode(node);
            }
        );

        breadcrumb.appendChild(span);

        if (index < path.length - 1) {

            const arrow =
                document.createElement("span");

            arrow.textContent = " › ";

            breadcrumb.appendChild(arrow);
        }
    });
}


// =========================
// 정보 패널
// =========================

function updateInfo() {

    const info =
        document.getElementById("info-content");

    if (!info || !currentNode) {
        return;
    }

    info.innerHTML = `
        <h2>${currentNode.name || ""}</h2>
        <p>
            ${currentNode.description || ""}
        </p>
    `;
}


// =========================
// 검색
// =========================

const searchInput =
    document.getElementById("search");

const searchResults =
    document.getElementById("search-results");


if (searchInput) {

    searchInput.addEventListener(
        "input",
        function() {

            const keyword =
                this.value.trim().toLowerCase();

            if (!keyword) {

                if (searchResults) {
                    searchResults.innerHTML = "";
                }

                return;
            }

            const results = [];

            nodeMap.forEach(node => {

                if (
                    node.name &&
                    node.name
                        .toLowerCase()
                        .includes(keyword)
                ) {
                    results.push(node);
                }
            });

            if (!searchResults) {
                return;
            }

            searchResults.innerHTML = "";

            results.slice(0, 20).forEach(node => {

                const item =
                    document.createElement("div");

                item.textContent = node.name;

                item.style.cursor = "pointer";

                item.addEventListener(
                    "click",
                    () => {
                        openSearchResult(node);
                    }
                );

                searchResults.appendChild(item);
            });
        }
    );
}


// =========================
// 검색 결과 열기
// =========================

function openSearchResult(node) {

    currentNode = node;

    drawTree();
    updateBreadcrumb();
    updateInfo();

    if (searchResults) {
        searchResults.innerHTML = "";
    }

    if (searchInput) {
        searchInput.value = "";
    }
}


// =========================
// 경로 찾기
// =========================

function findPath(targetNode) {

    const path = [];

    let node = targetNode;

    while (node) {

        path.unshift(node);

        node = node.parent;
    }

    return path;
}
