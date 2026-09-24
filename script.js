let treeData;

let currentNode;

let nodeMap = new Map();

let history = [];


// ========================================
// 데이터 불러오기
// ========================================

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


// ========================================
// 모든 노드 등록
// ========================================

function buildNodeMap(node) {

    nodeMap.set(node.id, node);

    if (node.children) {

        node.children.forEach(child => {

            buildNodeMap(child);

        });

    }

}


// ========================================
// 계통수 그리기
// ========================================

function drawTree() {

    const container =
        document.getElementById("tree-container");

    const svg =
        d3.select("#tree");


    // 기존 계통수 삭제

    svg.selectAll("*").remove();


    const width =
        container.clientWidth;

    const height =
        container.clientHeight;


    // ========================================
    // 최대 표시 깊이
    // ========================================
    //
    // 현재 선택된 노드 = depth 0
    //
    // 0 : 현재 노드
    // 1 : 하위
    // 2 : 하위의 하위
    // 3
    // 4
    //
    // 따라서 총 5단계 표시
    // ========================================

    const MAX_DEPTH = 4;


    // ========================================
    // 최대 깊이까지만 복사
    // ========================================

    const MAX_NODES = 5;


function createLimitedNode(node, depth = 1) {

    const newNode = {
        ...node
    };


    // 현재 노드를 포함해서
    // 5번째 노드까지 표시

    if (
        depth >= MAX_NODES ||
        !node.children ||
        node.children.length === 0
    ) {

        delete newNode.children;

        return newNode;

    }


    newNode.children =
        node.children.map(child => {

            return createLimitedNode(
                child,
                depth + 1
            );

        });


    return newNode;

}

        // 하위 노드를 재귀적으로 처리

        newNode.children =
            node.children.map(child => {

                return createLimitedNode(
                    child,
                    depth + 1
                );

            });


        return newNode;

    }


    // 현재 선택된 노드에서 시작

    const displayNode =
        createLimitedNode(
            currentNode,
            1
        );


    // ========================================
    // D3 계층 구조 생성
    // ========================================

    const root =
        d3.hierarchy(
            displayNode
        );


    // ========================================
    // 트리 레이아웃
    // ========================================

    const tree =
        d3.tree()
            .size([
                height - 100,
                width - 220
            ]);


    tree(root);


    // ========================================
    // SVG 그룹
    // ========================================

    const group =
        svg.append("g")
            .attr(
                "transform",
                "translate(80, 50)"
            );


    // ========================================
    // 연결선
    // ========================================

    group
        .selectAll(".link")
        .data(
            root.links()
        )
        .enter()
        .append("path")
        .attr(
            "class",
            "link"
        )
        .attr(
            "d",
            d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x)
        );


    // ========================================
    // 노드
    // ========================================

    const nodes =
        group
            .selectAll(".node")
            .data(
                root.descendants()
            )
            .enter()
            .append("g")
            .attr(
                "class",
                "node"
            )
            .attr(
                "transform",
                d =>
                    `translate(${d.y},${d.x})`
            )
            .on(
                "click",
                function(event, d) {

                    event.stopPropagation();

                    selectNode(
                        d.data
                    );

                }
            );


    // ========================================
    // 노드 원
    // ========================================

    nodes
        .append("circle")
        .attr(
            "r",
            d => {

                if (
                    d.data.id ===
                    currentNode.id
                ) {

                    return 9;

                }

                return 6;

            }
        );


    // ========================================
    // 한국명
    // ========================================

    nodes
        .append("text")
        .attr(
            "class",
            "korean"
        )
        .attr(
            "x",
            12
        )
        .attr(
            "dy",
            "-2"
        )
        .text(
            d =>
                d.data.name
        );


    // ========================================
    // 학명
    // ========================================

    nodes
        .append("text")
        .attr(
            "class",
            "scientific"
        )
        .attr(
            "x",
            12
        )
        .attr(
            "dy",
            "13"
        )
        .text(
            d =>
                d.data.scientificName || ""
        );


    // ========================================
    // 확대 / 축소 / 이동
    // ========================================

    const zoom =
        d3.zoom()
            .scaleExtent([
                0.3,
                4
            ])
            .on(
                "zoom",
                event => {

                    group.attr(
                        "transform",
                        event.transform
                    );

                }
            );


    svg.call(
        zoom
    );

}


// ========================================
// 노드 선택
// ========================================

function selectNode(node) {

    // 하위 분류군이 있는 경우

    if (
        node.children &&
        node.children.length > 0
    ) {

        // 현재 위치 저장

        history.push(
            currentNode
        );


        // 선택한 노드를 새로운 현재 위치로 설정

        currentNode =
            node;


        // 새로운 계통수 그리기

        drawTree();


        // UI 업데이트

        updateBreadcrumb();

        updateInfo(
            currentNode
        );


        return;

    }


    // 더 이상 하위 분류군이 없는 경우

    updateInfo(
        node
    );

}


// ========================================
// 이전으로
// ========================================

document
    .getElementById("back-button")
    .addEventListener(
        "click",
        () => {

            if (
                history.length === 0
            ) {

                return;

            }


            currentNode =
                history.pop();


            drawTree();

            updateBreadcrumb();

            updateInfo(
                currentNode
            );

        }
    );


// ========================================
// Breadcrumb
// ========================================

function updateBreadcrumb() {

    const breadcrumb =
        document.getElementById(
            "breadcrumb"
        );


    breadcrumb.innerHTML = "";


    const path =
        [
            ...history,
            currentNode
        ];


    path.forEach(
        (node, index) => {

            const span =
                document.createElement(
                    "span"
                );


            span.className =
                "breadcrumb-item";


            span.textContent =
                node.name;


            span.addEventListener(
                "click",
                () => {

                    goToBreadcrumb(
                        index
                    );

                }
            );


            breadcrumb.appendChild(
                span
            );


            if (
                index <
                path.length - 1
            ) {

                const separator =
                    document.createElement(
                        "span"
                    );


                separator.textContent =
                    "  ›  ";


                separator.style.color =
                    "#aaa";


                breadcrumb.appendChild(
                    separator
                );

            }

        }
    );

}


// ========================================
// Breadcrumb 이동
// ========================================

function goToBreadcrumb(index) {

    const path =
        [
            ...history,
            currentNode
        ];


    currentNode =
        path[index];


    history =
        path.slice(
            0,
            index
        );


    drawTree();

    updateBreadcrumb();

    updateInfo(
        currentNode
    );

}


// ========================================
// 정보 패널
// ========================================

function updateInfo(node) {

    const panel =
        document.getElementById(
            "info-content"
        );


    panel.innerHTML = `

        <h2>
            ${node.name}
        </h2>

        <div class="info-scientific">
            ${node.scientificName || ""}
        </div>

        <div class="info-rank">
            ${node.rank || ""}
        </div>

        <p class="info-description">
            ${
                node.description ||
                "설명이 없습니다."
            }
        </p>

        ${
            node.children
            ?
            `
            <p>
                하위 분류군:
                <strong>
                    ${node.children.length}
                </strong>개
            </p>
            `
            :
            `
            <p>
                더 이상 등록된
                하위 분류군이 없습니다.
            </p>
            `
        }

    `;

}


// ========================================
// 검색
// ========================================

const searchInput =
    document.getElementById(
        "search"
    );


const searchResults =
    document.getElementById(
        "search-results"
    );


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


        for (
            const node of nodeMap.values()
        ) {

            const name =
                (
                    node.name ||
                    ""
                )
                .toLowerCase();


            const scientific =
                (
                    node.scientificName ||
                    ""
                )
                .toLowerCase();


            if (
                name.includes(keyword) ||
                scientific.includes(keyword)
            ) {

                results.push(
                    node
                );

            }

        }


        results
            .slice(
                0,
                10
            )
            .forEach(
                node => {

                    const result =
                        document.createElement(
                            "div"
                        );


                    result.className =
                        "search-result";


                    result.innerHTML = `

                        <div class="search-result-name">
                            ${node.name}
                        </div>

                        <div class="search-result-scientific">
                            ${node.scientificName || ""}
                        </div>

                    `;


                    result.addEventListener(
                        "click",
                        () => {

                            openSearchResult(
                                node
                            );

                        }
                    );


                    searchResults.appendChild(
                        result
                    );

                }
            );


        searchResults.style.display =
            results.length
                ? "block"
                : "none";

    }
);


// ========================================
// 검색 결과 열기
// ========================================

function openSearchResult(node) {

    searchResults.style.display =
        "none";


    searchInput.value =
        "";


    // 검색한 생물까지의 경로 찾기

    const path =
        findPath(
            treeData,
            node.id
        );


    if (!path) {

        return;

    }


    // 검색한 노드를 현재 위치로 설정

    currentNode =
        path[
            path.length - 1
        ];


    // 조상 경로를 history로 설정

    history =
        path.slice(
            0,
            -1
        );


    drawTree();

    updateBreadcrumb();

    updateInfo(
        currentNode
    );

}


// ========================================
// 특정 노드까지의 경로 찾기
// ========================================

function findPath(
    node,
    targetId
) {

    if (
        node.id ===
        targetId
    ) {

        return [
            node
        ];

    }


    if (
        !node.children
    ) {

        return null;

    }


    for (
        const child
        of node.children
    ) {

        const result =
            findPath(
                child,
                targetId
            );


        if (result) {

            return [
                node,
                ...result
            ];

        }

    }


    return null;

}
