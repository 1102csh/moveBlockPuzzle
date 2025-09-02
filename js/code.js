const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const scoreText = document.getElementById("score");

let board = [];
let goalPositions = [];
let score = 0;
let currentStageIndex = 6;
let rows = 0;
let cols = 0;
let cellWidth = 0;
let cellHeight = 0;

// 저장 키명
const CLEAR_STORAGE_KEY = 'clearedStages';

// 클리어된 스테이지 목록 불러오기
function getClearedStages() {
    const raw = localStorage.getItem(CLEAR_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
}

// 스테이지 클리어 기록 저장
function saveClearedStage(index) {
    const cleared = getClearedStages();
    if (!cleared.includes(index)) {
        cleared.push(index);
        localStorage.setItem(CLEAR_STORAGE_KEY, JSON.stringify(cleared));
    }
}

// 모바일 환경 ///////////////////////////////////////////////////////////////
function isMobileDevice() {
    return /Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent);
}

window.addEventListener('load', () => {
    if (isMobileDevice()) {
        document.getElementById('controls').style.display = 'block';
    }
});

function resizeCanvas() {
    const scale = Math.min(window.innerWidth / (cols * 60), 1);
    canvas.style.transform = `scale(${scale})`;
    canvas.style.transformOrigin = 'top left';
}
window.addEventListener('resize', resizeCanvas);

function move(dir) {
    const keyMap = { up: 'w', down: 's', left: 'a', right: 'd' };
    const key = keyMap[dir];
    window.dispatchEvent(new KeyboardEvent('keydown', { key }));
}
/////////////////////////////////////////////////////////////////////////////

const blockColors = {
    2: '#00C2FF',
    3: '#FF6B6B',
    4: '#FFD93D',
    5: '#6BCB77',
    6: '#A66CFF',
    7: '#FFA07A',
    8: '#8b008b',
    10: '#ffc0cb',
    11: '#778899',
    12: '#20B2AA',
    13: '#DA70D6',
    14: '#987654'
};

// 🔢 스테이지 목록
const stages = [
    {
        board: [
            [2, 2, 1, 1, 1, 1],
            [2, 2, 1, 1, 1, 1],
            [3, 3, 4, 4, 0, 0],
            [3, 3, 4, 4, 1, 1],
            [5, 5, 6, 6, 1, 1],
            [7, 7, 8, 8, 1, 1],
            [1, 1, 9, 9, 1, 1],
            [1, 1, 9, 9, 1, 1]
        ]
    },
    {
        board: [
            [1, 1, 2, 2, 1, 1],
            [1, 1, 2, 2, 1, 1],
            [0, 0, 0, 0, 0, 0],
            [0, 3, 3, 5, 5, 0],
            [1, 4, 3, 5, 6, 1],
            [1, 4, 4, 6, 6, 1],
            [1, 1, 7, 7, 1, 1],
            [1, 1, 9, 9, 1, 1]
        ]
    },
    {
        board: [
            [1, 1, 2, 2, 1, 1, 1],
            [1, 1, 2, 2, 1, 1, 1],
            [1, 0, 3, 0, 4, 0, 1],
            [0, 3, 3, 3, 4, 4, 1],
            [0, 0, 3, 1, 5, 5, 0],
            [0, 8, 8, 7, 6, 6, 1],
            [1, 0, 8, 7, 6, 0, 1],
            [1, 1, 9, 9, 1, 1, 1],
            [1, 1, 9, 9, 1, 1, 1]
        ]
    },
    {
        board: [
            [3, 3, 5, 10, 12],
            [2, 2, 6, 10, 9],
            [2, 2, 7, 11, 9],
            [4, 4, 8, 11, 13]
        ]
    },
    {
        board: [
            [1, 1, 2, 1, 1],
            [3, 4, 4, 0, 0],
            [3, 4, 4, 5, 5],
            [6, 6, 7, 7, 8],
            [0, 0, 7, 7, 10],
            [1, 1, 9, 1, 1]
        ]
    },
    {
        board: [
            [3,   0,  4,  5,  0,  0, 1],
            [3,   0,  4,  5,  6,  6, 1],
            [2,   2,  0,  1,  0,  7, 9],
            [8,   0,  0, 10, 12,  7, 1],
            [8,  11, 11, 10, 12,  7, 1],
            [13, 13, 13,  0, 14, 14, 1]
        ]   
    },
    {
        board: [
            [ 2, 2,  3,  4],
            [ 2, 2,  5,  5],
            [ 6, 8, 10,  9],
            [ 7, 8,  9, 11],
        ]
    },
    {
        board: [
            [2, 2,  3, 4, 4],
            [2, 2,  3, 4, 4],
            [5, 5,  6, 7, 7],
            [8, 8, 10, 9, 9],
            [8, 8, 10, 9, 9]
        ]
    },
    {
        board: [
            [2, 2,  3, 3, 4],
            [2, 2,  3, 3, 4],
            [5, 5,  6, 7, 7],
            [5, 5, 10, 9, 9],
            [8, 8, 10, 9, 9]
        ]
    }
];

const stageButtonsEl = document.getElementById("stageButtons");
const stageSelectorEl = document.getElementById("stageSelector");
const toggleStageBtn = document.getElementById("toggleStageBtn");

// 버튼 생성
function createStageButtons() {
    stageButtonsEl.innerHTML = "";
    stages.forEach((_, index) => {
        const btn = document.createElement("button");
        btn.textContent = index + 1;
        btn.classList.toggle("active", index === currentStageIndex);
        btn.addEventListener("click", () => {
            currentStageIndex = index;
            loadStage(currentStageIndex);
            updateStageButtons();
        });
        stageButtonsEl.appendChild(btn);
    });
}

function updateStageButtons() {
    Array.from(stageButtonsEl.children).forEach((btn, index) => {
        btn.classList.toggle("active", index === currentStageIndex);
    });
}

// 축소/확대 토글
toggleStageBtn.addEventListener("click", () => {
    stageSelectorEl.classList.toggle("collapsed");
    toggleStageBtn.textContent = stageSelectorEl.classList.contains("collapsed") ? "▲" : "▼";
});

function createStageButtons() {
    stageButtonsEl.innerHTML = "";
    const clearedStages = getClearedStages();

    stages.forEach((_, index) => {
        const btn = document.createElement("button");
        btn.textContent = index + 1;

        if (clearedStages.includes(index)) {
            btn.textContent += " 👑"; // 왕관 추가
        }

        btn.classList.toggle("active", index === currentStageIndex);
        btn.addEventListener("click", () => {
            currentStageIndex = index;
            loadStage(currentStageIndex);
            updateStageButtons();
        });

        stageButtonsEl.appendChild(btn);
    });
}

// 선택된 블럭 상태
let targetGroup = null;
let targetValue = null;

// 스테이지 불러오기
function loadStage(index) {
    const stage = stages[index];
    board = JSON.parse(JSON.stringify(stage.board));
    rows = board.length;
    cols = board[0].length;

    const baseSize = isMobileDevice() ? 40 : 60;  // 모바일이면 셀 크기를 줄임

    // 캔버스 크기 및 셀 크기 설정
    canvas.width = cols * baseSize;
    canvas.height = rows * baseSize;
    cellWidth = canvas.width / cols;
    cellHeight = canvas.height / rows;
    document.getElementById("utilWrap").style.width = canvas.width + 'px';
    document.getElementById("resetWrap").style.width = canvas.width + 'px';

    // 도착지 찾기
    goalPositions = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c] === 9) {
                goalPositions.push({ row: r, col: c });
            }
        }
    }

    targetGroup = null;
    targetValue = null;
    score = 0;
    scoreText.innerText = 0;
    drawBoard();
}

////////////////////// Path Finder /////////////////////////////
function isClearable(board, goalPositions) {
    const rows = board.length;
    const cols = board[0].length;
    const key = (r, c) => `${r},${c}`;

    // 🔍 2번 블럭 덩어리 찾기
    function findGroup(value) {
        const visited = {};
        const stack = [];
        const group = [];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (board[r][c] === value) {
                    stack.push([r, c]);
                    visited[key(r, c)] = true;
                    break;
                }
            }
            if (stack.length) break;
        }

        while (stack.length) {
            const [r, c] = stack.pop();
            group.push({ row: r, col: c });
            for (const [dy, dx] of [[0,1],[1,0],[0,-1],[-1,0]]) {
                const nr = r + dy, nc = c + dx;
                if (
                    nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
                    board[nr][nc] === 2 && !visited[key(nr, nc)]
                ) {
                    visited[key(nr, nc)] = true;
                    stack.push([nr, nc]);
                }
            }
        }
        return group;
    }

    function serialize(group) {
        return group.map(p => `${p.row},${p.col}`).sort().join('|');
    }

    const initialGroup = findGroup(2);
    const visited = new Set();
    const queue = [initialGroup];

    visited.add(serialize(initialGroup));

    while (queue.length > 0) {
        const currentGroup = queue.shift();

        // 🏁 클리어 조건 검사
        const allOnGoal = goalPositions.every(goal =>
            currentGroup.some(p => p.row === goal.row && p.col === goal.col)
        );
        if (allOnGoal) return true;

        for (const [dy, dx] of [[0,1],[1,0],[0,-1],[-1,0]]) {
            const nextGroup = currentGroup.map(({ row, col }) => ({
                row: row + dy,
                col: col + dx
            }));

            const canMove = nextGroup.every(({ row, col }) =>
                row >= 0 && row < rows &&
                col >= 0 && col < cols &&
                (board[row][col] === 0 || board[row][col] === 9 || currentGroup.some(p => p.row === row - dy && p.col === col - dx))
            );

            if (!canMove) continue;

            const serialized = serialize(nextGroup);
            if (visited.has(serialized)) continue;

            visited.add(serialized);
            queue.push(nextGroup);
        }
    }

    return false; // 경로 없음
}
///////////////////////////////////////////////////////////////////

// 보드 그리기
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const margin = 4;

    // 도착지 그리기
    for (const { row, col } of goalPositions) {
        const x = col * cellWidth;
        const y = row * cellHeight;
        ctx.fillStyle = '#D0FFD0';
        ctx.fillRect(x, y, cellWidth, cellHeight);
    }

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = col * cellWidth;
            const y = row * cellHeight;
            const value = board[row][col];

            // 기본 셀 테두리
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, cellWidth, cellHeight);

            if (value === 1) {
                ctx.fillStyle = '#444';
                ctx.fillRect(x, y, cellWidth, cellHeight);
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#444';
                ctx.strokeRect(x, y, cellWidth, cellHeight);
                ctx.strokeStyle = '#ccc';
            } else if (blockColors[value]) {
                ctx.fillStyle = blockColors[value];
                ctx.fillRect(
                    x + margin,
                    y + margin,
                    cellWidth - margin * 2,
                    cellHeight - margin * 2
                );

                // 선택된 블럭 강조
                if (targetGroup && targetGroup.some(p => p.row === row && p.col === col)) {
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(
                        x + margin,
                        y + margin,
                        cellWidth - margin * 2,
                        cellHeight - margin * 2
                    );
                }
            }
        }
    }

    scoreText.innerText = score;
}

// 연결된 블럭 찾기
function findConnectedGroup(row, col, value, visited = {}) {
    const stack = [[row, col]];
    const group = [];
    const key = (r, c) => `${r},${c}`;
    visited[key(row, col)] = true;

    while (stack.length > 0) {
        const [r, c] = stack.pop();
        group.push({ row: r, col: c });

        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        for (const [dy, dx] of directions) {
            const nr = r + dy;
            const nc = c + dx;

            if (
                nr >= 0 && nr < rows &&
                nc >= 0 && nc < cols &&
                !visited[key(nr, nc)] &&
                board[nr][nc] === value
            ) {
                visited[key(nr, nc)] = true;
                stack.push([nr, nc]);
            }
        }
    }

    return group;
}

// 블럭 클릭
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const col = Math.floor(mouseX / cellWidth);
    const row = Math.floor(mouseY / cellHeight);
    const value = board[row][col];

    // if (value >= 2 && value <= 8)
    if (blockColors[value]) {
        targetGroup = findConnectedGroup(row, col, value);
        targetValue = value;
        drawBoard();
    }
});

// 커서 포인터 처리
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const col = Math.floor(mouseX / cellWidth);
    const row = Math.floor(mouseY / cellHeight);

    // if (board[row][col] >= 2 && board[row][col] <= 8) || (board[row][col] > 9)
    if (
        row >= 0 && row < rows &&
        col >= 0 && col < cols &&
        blockColors[board[row][col]]
    ) {
        canvas.style.cursor = 'pointer';
    } else {
        canvas.style.cursor = 'default';
    }
});

// 방향키로 이동
window.addEventListener('keydown', (e) => {
    if (!targetGroup || !targetValue) return;

    let dx = 0, dy = 0;
    if (e.key === 'ArrowUp' || e.key === 'w') dy = -1;
    else if (e.key === 'ArrowDown' || e.key === 's') dy = 1;
    else if (e.key === 'ArrowLeft' || e.key === 'a') dx = -1;
    else if (e.key === 'ArrowRight' || e.key === 'd') dx = 1;
    else return;

    const key = (r, c) => `${r},${c}`;
    const groupSet = new Set(targetGroup.map(p => key(p.row, p.col)));

    const nextGroup = targetGroup.map(({ row, col }) => ({
        row: row + dy,
        col: col + dx
    }));

    const canMove = nextGroup.every(({ row, col }) =>
        row >= 0 && row < rows &&
        col >= 0 && col < cols &&
        (
            board[row][col] === 0 ||
            board[row][col] === 9 ||
            groupSet.has(key(row, col))
        )
    );

    if (!canMove) return;

    score += 1;

    const isGoal = (r, c) =>
        goalPositions.some(p => p.row === r && p.col === c);

    for (const { row, col } of targetGroup) {
        board[row][col] = isGoal(row, col) ? 9 : 0;
    }

    targetGroup = nextGroup;

    for (const { row, col } of targetGroup) {
        board[row][col] = targetValue;
    }

    drawBoard();

    // 클리어 조건 확인
    if (targetValue === 2) {
        const isClear = goalPositions.every(goal =>
            targetGroup.some(block =>
                block.row === goal.row && block.col === goal.col
            )
        );

        if (isClear) {
            saveClearedStage(currentStageIndex); // ← 클리어 기록 저장
            createStageButtons();  // ← 클리어 직후 버튼 다시 생성해서 왕관 반영

            setTimeout(() => {
                alert("🎉 클리어!");
                if (currentStageIndex + 1 < stages.length) {
                    currentStageIndex++;
                    loadStage(currentStageIndex);
                    updateStageButtons(); // ← 버튼도 업데이트
                }
            }, 100);
        }
    }
});

// 다시 시작
document.getElementById('resetWrap').addEventListener('click', () => {
    loadStage(currentStageIndex);
});

createStageButtons();
updateStageButtons();

// 시작
loadStage(currentStageIndex);

const clearable = isClearable(board, goalPositions);
console.log(clearable ? "Possible" : "Impossible");
