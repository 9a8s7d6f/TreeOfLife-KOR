let treeData;

let currentNode;

let nodeMap = new Map();

let history = [];


/* =========================
   데이터 불러오기
========================= */

fetch("tree.json")
    .then(response => response.json())
    .then(data => {

        treeData = data;

        buildNodeMap(treeData);

        currentNode = treeData;

        drawTree();

        updateBreadcrumb();

        updateInfo(currentNode);

    })
    .catch(error => {

        console.error(error);

        document.getElementById("tree-container")
            .innerHTML =
            "<p style='padding:30px'>tree.json을 불러오지 못했습니다.</p>";

    });


/* =========================
   모든 노드 등록
========================= */

function buildNodeMap(node) {

    nodeMap.set(node.id, node);

    if (node.children) {

        node.children.forEach(child => {

            buildNodeMap(child);

        });

    }
}


/* =========================
   계통수 그리기
========================= */

function drawTree() {

    const container =
        document.getElementById("tree-container");

    const svg =
        d3.select("#tree");

    svg.selectAll("*").remove();


    const width = container.clientWidth;

    const height = container.clientHeight;


    const root =
        d3.hierarchy(currentNode);


    const tree =
        d3.tree()
            .size([
                height - 100,
                width - 220
            ]);


    tree(root);


    /*
       SVG 내부의 실제 계통수를
       움직이기 위한 그룹
    */

    const group =
        svg.append("g")
            .attr(
                "transform",
                "translate(80, 50)"
            );


    /* =========================
       연결선
    ========================= */

    group
        .selectAll(".link")
        .data(root.links())
        .enter()
        .append("path")
        .attr("class", "link")
        .attr(
            "d",
            d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x)
        );


    /* =========================
       노드
    ========================= */

    const nodes =
        group
            .selectAll(".node")
            .data(root.descendants())
            .enter()
            .append("g")
            .attr("class", "node")
            .attr(
                "transform",
                d => `translate(${d.y},${d.x})`
            )
            .on("click", function(event, d) {

                event.stopPropagation();

                selectNode(d.data);

            });


    nodes
        .append("circle")
        .attr("r", d => {

            if (d.data.id === currentNode.id) {

                return 9;

            }

            return 6;

        });


    /*
       한국명
    */

    nodes
        .append("text")
        .attr("class", "korean")
        .attr("x", 12)
        .attr("dy", "-2")
        .text(d => d.data.name);


    /*
       학명
    */

    nodes
        .append("text")
        .attr("class", "scientific")
        .attr("x", 12)
        .attr("dy", "13")
        .text(d => d.data.scientificName);


    /*
       드래그해서 이동
    */

    const zoom =
        d3.zoom()
            .scaleExtent([0.3, 4])
            .on("zoom", event => {

                group.attr(
                    "transform",
                    event.transform
                );

            });


    svg.call(zoom);

}


/* =========================
   노드 선택
========================= */

function selectNode(node) {

    /*
       하위 분류가 있으면
       그 안으로 이동
    */

    if (node.children && node.children.length > 0) {

        history.push(currentNode);

        currentNode = node;

        drawTree();

        updateBreadcrumb();

        updateInfo(node);

        return;

    }


    /*
       하위 분류가 없는 경우
       이동하지 않고 정보만 표시
    */

    updateInfo(node);

}


/* =========================
   이전으로
========================= */

document
    .getElementById("back-button")
    .addEventListener("click", () => {

        if (history.length === 0) {

            return;

        }

        currentNode =
            history.pop();

        drawTree();

        updateBreadcrumb();

        updateInfo(currentNode);

    });


/* =========================
   Breadcrumb
========================= */

function updateBreadcrumb() {

    const breadcrumb =
        document.getElementById("breadcrumb");

    breadcrumb.innerHTML = "";


    const path =
        [...history, currentNode];


    path.forEach((node, index) => {

        const span =
            document.createElement("span");

        span.className =
            "breadcrumb-item";

        span.textContent =
            node.name;


        span.addEventListener(
            "click",
            () => {

                goToBreadcrumb(index);

            }
        );


        breadcrumb.appendChild(span);


        if (index < path.length - 1) {

            const separator =
                document.createElement("span");

            separator.textContent =
                "  ›  ";

            separator.style.color =
                "#aaa";

            breadcrumb.appendChild(separator);

        }

    });

}


/* =========================
   Breadcrumb 이동
========================= */

function goToBreadcrumb(index) {

    const path =
        [...history, currentNode];


    currentNode =
        path[index];


    history =
        path.slice(0, index);


    drawTree();

    updateBreadcrumb();

    updateInfo(currentNode);

}


/* =========================
   정보 패널
========================= */

function updateInfo(node) {

    const panel =
        document.getElementById("info-content");


    panel.innerHTML = `

        <h2>${node.name}</h2>

        <div class="info-scientific">
            ${node.scientificName || ""}
        </div>

        <div class="info-rank">
            ${node.rank || ""}
        </div>

        <p class="info-description">
            ${node.description || "설명이 없습니다."}
        </p>

        ${
            node.children
            ?
            `<p>
                하위 분류군:
                <strong>${node.children.length}</strong>개
            </p>`
            :
            `<p>
                더 이상 등록된 하위 분류군이 없습니다.
            </p>`
        }

    `;

}


/* =========================
   검색
========================= */

const searchInput =
    document.getElementById("search");

const searchResults =
    document.getElementById("search-results");


searchInput.addEventListener(
    "input",
    () => {

        const keyword =
            searchInput.value
                .trim()
                .toLowerCase();


        searchResults.innerHTML = "";


        if (!keyword) {

            searchResults.style.display =
                "none";

            return;

        }


        const results = [];


        for (const node of nodeMap.values()) {

            const name =
                (node.name || "")
                    .toLowerCase();

            const scientific =
                (node.scientificName || "")
                    .toLowerCase();


            if (
                name.includes(keyword) ||
                scientific.includes(keyword)
            ) {

                results.push(node);

            }

        }


        results
            .slice(0, 10)
            .forEach(node => {

                const result =
                    document.createElement("div");

                result.className =
                    "search-result";


                result.innerHTML = `

                    <div class="search-result-name">
                        ${node.name}
                    </div>

                    <div class="search-result-scientific">
                        ${node.scientificName}
                    </div>

                `;


                result.addEventListener(
                    "click",
                    () => {

                        openSearchResult(node);

                    }
                );


                searchResults.appendChild(result);

            });


        searchResults.style.display =
            results.length
                ? "block"
                : "none";

    });


/* =========================
   검색 결과 열기
========================= */

function openSearchResult(node) {

    searchResults.style.display =
        "none";

    searchInput.value =
        "";


    /*
       검색된 생물의 조상 경로 찾기
    */

    const path =
        findPath(treeData, node.id);


    if (!path) {

        return;

    }


    currentNode =
        path[path.length - 1];


    history =
        path.slice(0, -1);


    drawTree();

    updateBreadcrumb();

    updateInfo(currentNode);

}


/* =========================
   특정 노드까지의 경로 찾기
========================= */

function findPath(node, targetId) {

    if (node.id === targetId) {

        return [node];

    }


    if (!node.children) {

        return null;

    }


    for (const child of node.children) {

        const result =
            findPath(child, targetId);


        if (result) {

            return [
                node,
                ...result
            ];

        }

    }


    return null;

}
