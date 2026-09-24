let treeData;

let currentNode;

let nodeMap = new Map();

let history = [];

// 한 화면에 표시할 하위 분류군 수
const CHILDREN_PER_PAGE = 5;

// 현재 하위 분류군 페이지
let childrenPage = 0;


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


    const totalChildren =
    currentNode.children
        ? currentNode.children.length
        : 0;


// 현재 페이지의 시작 위치
const start =
    childrenPage * CHILDREN_PER_PAGE;


// 현재 페이지에서 보여줄 5개
const visibleChildren =
    currentNode.children
        ? currentNode.children.slice(
            start,
            start + CHILDREN_PER_PAGE
        )
        : undefined;


// 실제 계통수에 표시할 데이터
const displayNode = {
    ...currentNode,
    children: visibleChildren
};


const root =
    d3.hierarchy(displayNode);


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

   // 기존 페이지 버튼 제거
d3.select("#page-controls").remove();


// 하위 분류군이 5개를 초과하는 경우
if (totalChildren > CHILDREN_PER_PAGE) {

    const totalPages =
        Math.ceil(
            totalChildren / CHILDREN_PER_PAGE
        );


    const controls =
        d3.select("#tree-container")
            .append("div")
            .attr("id", "page-controls");


    // 이전 페이지
    if (childrenPage > 0) {

        controls
            .append("button")
            .text("← 이전")
            .on("click", () => {

                childrenPage--;

                drawTree();

            });

    }


    // 현재 페이지 표시
    controls
        .append("span")
        .text(
            ` ${childrenPage + 1} / ${totalPages} `
        );


    // 다음 페이지
    if (
        childrenPage <
        totalPages - 1
    ) {

        controls
            .append("button")
            .text("다음 →")
            .on("click", () => {

                childrenPage++;

                drawTree();

            });

    }

}

}


/* =========================
   노드 선택
========================= */

function selectNode(node) {

    if (node.children && node.children.length > 0) {

        history.push(currentNode);

        currentNode = node;

        // 새로운 분류군에 들어오면
        // 다시 첫 번째 5개부터 표시
        childrenPage = 0;

        drawTree();

        updateBreadcrumb();

        updateInfo(node);

        return;
    }

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
