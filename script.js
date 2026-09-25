let treeData = null;
let currentNode = null;
let nodeMap = new Map();

// 뒤로가기 기록
let navigationHistory = [];

const MAX_LEVEL = 5;


// ==================================================
// 데이터 불러오기
// ==================================================

fetch("tree.json")
    .then(response => {

        if (!response.ok) {
            throw new Error("tree.json을 불러오지 못했습니다.");
        }

        return response.json();
    })
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

        // 처음에는 전체 데이터의 루트
        currentNode = treeData;

        drawTree();
        updateBreadcrumb();
        updateInfo();
    })
    .catch(error => {

        console.error(
            "tree.json 불러오기 실패:",
            error
        );
    });


// ==================================================
// 현재 노드에서 5단계까지만 복사
// ==================================================

function limitTree(node, level = 1) {

    const result = {
        ...node
    };


    // 현재 노드를 1단계로 계산하여
    // 총 5단계까지만 표시
    if (level >= MAX_LEVEL) {

        // 화면에서는 그 아래를 숨김
        delete result.children;

        return result;
    }


    // 하위 노드가 있으면 계속 복사
    if (
        node.children &&
        node.children.length > 0
    ) {

        result.children =
            node.children.map(child => {

                return limitTree(
                    child,
                    level + 1
                );
            });
    }


    return result;
}


// ==================================================
// 트리 그리기
// ==================================================

function drawTree() {

    const container =
        document.getElementById("tree");


    if (!container) {

        console.error(
            "#tree 요소를 찾을 수 없습니다."
        );

        return;
    }


    // 기존 트리 삭제
    container.innerHTML = "";


    // 현재 노드부터 5단계까지만 사용
    const displayData =
        limitTree(
            currentNode,
            1
        );


    const width = 1000;
    const height = 700;


    // SVG 생성
    const svg =
        d3.select(container)
            .append("svg")
            .attr("width", width)
            .attr("height", height);


    // 전체 트리 그룹
    const g =
        svg.append("g")
            .attr(
                "transform",
                "translate(100, 50)"
            );


    // D3 hierarchy 생성
    const root =
        d3.hierarchy(displayData);


    // 트리 레이아웃
    const treeLayout =
        d3.tree()
            .size([
                height - 100,
                width - 250
            ]);


    treeLayout(root);


    // ==================================================
    // 연결선
    // ==================================================

    g.selectAll(".link")
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


    // ==================================================
    // 노드
    // ==================================================

    const nodes =
        g.selectAll(".node")
            .data(root.descendants())
            .enter()
            .append("g")
            .attr("class", "node")
            .attr(
                "transform",
                d =>
                    `translate(${d.y}, ${d.x})`
            )
            .style(
                "cursor",
                "pointer"
            );


    // ==================================================
    // 노드 클릭
    // ==================================================

    nodes.on(
        "click",
        function(event, d) {

            // 화면에 표시된 노드는
            // limitTree()에서 복사된 데이터임
            //
            // 따라서 ID를 이용해서
            // 원본 노드를 다시 찾음

            let originalNode =
                d.data;


            if (
                d.data.id &&
                nodeMap.has(d.data.id)
            ) {

                originalNode =
                    nodeMap.get(
                        d.data.id
                    );
            }


            // 실제 원본 노드로 이동
            selectNode(
                originalNode
            );
        }
    );


    // ==================================================
    // 노드 원
    // ==================================================

    nodes.append("circle")
        .attr("r", 7);


    // ==================================================
    // 노드 이름
    // ==================================================

    nodes.append("text")
        .attr("dx", 12)
        .attr("dy", 4)
        .text(
            d => d.data.name
        );


    // ==================================================
    // 줌
    // ==================================================

    const zoom =
        d3.zoom()
            .scaleExtent([
                0.3,
                3
            ])
            .on(
                "zoom",
                event => {

                    g.attr(
                        "transform",
                        event.transform
                    );
                }
            );


    svg.call(zoom);
}


// ==================================================
// 노드 선택
// ==================================================

function selectNode(node) {

    if (!node) {
        return;
    }


    // 같은 노드를 다시 누른 경우
    // 기록하지 않음
    if (
        currentNode &&
        currentNode !== node
    ) {

        navigationHistory.push(
            currentNode
        );
    }


    // 새로운 현재 위치
    currentNode = node;


    drawTree();

    updateBreadcrumb();

    updateInfo();
}


// ==================================================
// 뒤로가기
// ==================================================

const backButton =
    document.getElementById(
        "back-button"
    );


if (backButton) {

    backButton.addEventListener(
        "click",
        function() {

            // 이전 기록이 없으면 아무것도 하지 않음
            if (
                navigationHistory.length === 0
            ) {

                return;
            }


            // 가장 최근 위치를 가져옴
            currentNode =
                navigationHistory.pop();


            drawTree();

            updateBreadcrumb();

            updateInfo();
        }
    );
}


// ==================================================
// Breadcrumb
// ==================================================

function updateBreadcrumb() {

    const breadcrumb =
        document.getElementById(
            "breadcrumb"
        );


    if (!breadcrumb) {
        return;
    }


    const path = [];

    let node =
        currentNode;


    // 현재 노드에서 루트까지 올라감
    while (node) {

        path.unshift(node);

        node =
            node.parent;
    }


    breadcrumb.innerHTML = "";


    path.forEach(
        (node, index) => {

            const span =
                document.createElement(
                    "span"
                );


            span.textContent =
                node.name;


            span.style.cursor =
                "pointer";


            // Breadcrumb 클릭
            span.addEventListener(
                "click",
                () => {

                    if (
                        node === currentNode
                    ) {

                        return;
                    }


                    selectNode(node);
                }
            );


            breadcrumb.appendChild(
                span
            );


            // 화살표
            if (
                index <
                path.length - 1
            ) {

                const arrow =
                    document.createElement(
                        "span"
                    );


                arrow.textContent =
                    " › ";


                breadcrumb.appendChild(
                    arrow
                );
            }
        }
    );
}


// ==================================================
// 정보 패널
// ==================================================

function updateInfo() {

    const info =
        document.getElementById(
            "info-content"
        );


    if (
        !info ||
        !currentNode
    ) {

        return;
    }


    info.innerHTML = `
        <h2>${currentNode.name || ""}</h2>
        <p>
            ${currentNode.description || ""}
        </p>
    `;
}


// ==================================================
// 검색
// ==================================================

const searchInput =
    document.getElementById(
        "search"
    );


const searchResults =
    document.getElementById(
        "search-results"
    );


if (searchInput) {

    searchInput.addEventListener(
        "input",
        function() {

            const keyword =
                this.value
                    .trim()
                    .toLowerCase();


            // 검색어가 없으면 결과 삭제
            if (!keyword) {

                if (searchResults) {

                    searchResults.innerHTML =
                        "";
                }

                return;
            }


            const results = [];


            // 모든 분류군 검색
            nodeMap.forEach(
                node => {

                    if (
                        node.name &&
                        node.name
                            .toLowerCase()
                            .includes(
                                keyword
                            )
                    ) {

                        results.push(
                            node
                        );
                    }
                }
            );


            if (!searchResults) {
                return;
            }


            searchResults.innerHTML =
                "";


            // 최대 20개
            results
                .slice(0, 20)
                .forEach(
                    node => {

                        const item =
                            document.createElement(
                                "div"
                            );


                        item.textContent =
                            node.name;


                        item.style.cursor =
                            "pointer";


                        item.addEventListener(
                            "click",
                            () => {

                                openSearchResult(
                                    node
                                );
                            }
                        );


                        searchResults.appendChild(
                            item
                        );
                    }
                );
        }
    );
}


// ==================================================
// 검색 결과 열기
// ==================================================

function openSearchResult(node) {

    if (!node) {
        return;
    }


    // 현재 위치를 뒤로가기 기록에 저장
    if (
        currentNode &&
        currentNode !== node
    ) {

        navigationHistory.push(
            currentNode
        );
    }


    // 검색 결과를 현재 위치로 지정
    currentNode =
        node;


    drawTree();

    updateBreadcrumb();

    updateInfo();


    // 검색창 초기화
    if (searchResults) {

        searchResults.innerHTML =
            "";
    }


    if (searchInput) {

        searchInput.value =
            "";
    }
}


// ==================================================
// 경로 찾기
// ==================================================

function findPath(targetNode) {

    const path = [];

    let node =
        targetNode;


    while (node) {

        path.unshift(node);

        node =
            node.parent;
    }


    return path;
}
