let canvas, ctx;
let score = 0;
let timeLeft = 120;
let isGameRunning = false;
let particle = null;
let nuclei = [];
let targets = [];
const targetArea = { x: 100, y: 50, width: 600, height: 50 }; // เส้นฐานด้านบนสำหรับเป้ากระดาษ
const gunPosition = { x: 400, y: 550 }; // ตำแหน่งปืน

window.onload = function() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    resizeCanvas(); // ปรับขนาด canvas

    window.addEventListener('resize', resizeCanvas);

    document.getElementById('main-menu').style.display = 'block'; // แสดงเมนูหลัก

    document.getElementById('start-game').addEventListener('click', startGame);
    document.getElementById('fire-button').addEventListener('click', fireParticle);
    document.getElementById('restart-game').addEventListener('click', restartGame);
    document.getElementById('exit').addEventListener('click', () => window.location.reload());
    document.getElementById('how-to-play').addEventListener('click', () => document.getElementById('popup').style.display = 'block');
    document.getElementById('close-popup').addEventListener('click', () => document.getElementById('popup').style.display = 'none');

    // การลากนิวเคลียสสำหรับการสัมผัส
    canvas.addEventListener('touchstart', selectNucleusTouch);
    canvas.addEventListener('touchmove', moveNucleusTouch);
    canvas.addEventListener('touchend', dropNucleus);

    // สร้างนิวเคลียส 3 อันไว้ข้างๆ ปืนยิง
    for (let i = 0; i < 3; i++) {
        nuclei.push({ x: gunPosition.x + 30 * i - 30, y: gunPosition.y - 30, radius: 15, isActive: true });
    }

    // การลากนิวเคลียสด้วยเมาส์
    canvas.addEventListener('mousedown', selectNucleus);
    canvas.addEventListener('mousemove', moveNucleus);
    canvas.addEventListener('mouseup', dropNucleus);
    canvas.addEventListener('mousemove', updateAimLine); // อัปเดตเส้นเล็งตามเมาส์

    gameLoop(); // เรียกฟังก์ชัน gameLoop ครั้งแรกเพื่อเริ่มต้นการวาด
};

// ฟังก์ชันปรับขนาด canvas
function resizeCanvas() {
    canvas.width = window.innerWidth > 800 ? 800 : window.innerWidth;
    canvas.height = window.innerHeight > 600 ? 600 : window.innerHeight;
}

// ฟังก์ชันเริ่มเกม
function startGame() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    isGameRunning = true;
    score = 0;
    timeLeft = 180;
    resetNuclei(); // รีเซ็ตนิวเคลียส
    updateTimer();
    spawnTarget();
    gameLoop();
}

// ฟังก์ชันเลือกนิวเคลียสสำหรับสัมผัส
function selectNucleusTouch(event) {
    const touch = event.touches[0];
    selectNucleus({ clientX: touch.clientX, clientY: touch.clientY });
}

// ฟังก์ชันเคลื่อนที่นิวเคลียสสำหรับสัมผัส
function moveNucleusTouch(event) {
    const touch = event.touches[0];
    moveNucleus({ clientX: touch.clientX, clientY: touch.clientY });
}

// ฟังก์ชันเลือกนิวเคลียส
function selectNucleus(event) {
    if (isGameRunning) {
        let rect = canvas.getBoundingClientRect();
        let mouseX = event.clientX - rect.left;
        let mouseY = event.clientY - rect.top;

        // ตรวจสอบการคลิกที่นิวเคลียส
        for (let nucleus of nuclei) {
            if (nucleus.isActive && Math.hypot(mouseX - nucleus.x, mouseY - nucleus.y) < nucleus.radius) {
                activeNucleus = nucleus; // เก็บนิวเคลียสที่ถูกเลือก
                break;
            }
        }
    }
}

// ฟังก์ชันเคลื่อนที่นิวเคลียส
function moveNucleus(event) {
    if (isGameRunning && activeNucleus) {
        let rect = canvas.getBoundingClientRect();
        activeNucleus.x = event.clientX - rect.left;
        activeNucleus.y = event.clientY - rect.top;
    }
}

// ฟังก์ชันปล่อยนิวเคลียส
function dropNucleus() {
    if (isGameRunning && activeNucleus) {
        activeNucleus = null; // ยกเลิกการเลือกนิวเคลียส
    }
}

// ฟังก์ชันยิงอนุภาค
function fireParticle() {
    if (isGameRunning) {
        let aimLineX = activeNucleus ? activeNucleus.x : gunPosition.x; // ใช้ตำแหน่งนิวเคลียสหรือปืนถ้าไม่มีนิวเคลียส
        let aimLineY = activeNucleus ? activeNucleus.y : gunPosition.y - 100; // สูงกว่าปืน

        let dx = aimLineX - gunPosition.x; // ความต่างในแกน x
        let dy = aimLineY - gunPosition.y; // ความต่างในแกน y
        let length = Math.sqrt(dx * dx + dy * dy);
        if (length > 0) { // ป้องกันการหารด้วยศูนย์
            particle = { 
                x: gunPosition.x, 
                y: gunPosition.y, 
                vx: (dx / length) * 5, 
                vy: (dy / length) * 5 
            };
            if (activeNucleus) {
                activeNucleus.isActive = false; // ทำให้ไม่สามารถเลือกนิวเคลียสอีก
            }
        }
    }
}

// ฟังก์ชัน Spawn เป้ากระดาษ
function spawnTarget() {
    let x = targetArea.x + Math.random() * targetArea.width; // สุ่มตำแหน่ง x ภายใน targetArea
    let y = targetArea.y + targetArea.height + 30; // ตำแหน่ง y ต่ำกว่าเส้นฐานประมาณ 30 พิกเซล
    targets.push({ x: x, y: y, radius: 25 });
}

// ฟังก์ชันรีเซ็ตนิวเคลียส
function resetNuclei() {
    for (let i = 0; i < nuclei.length; i++) {
        nuclei[i].isActive = true; // กำหนดสถานะนิวเคลียสให้ใช้งานได้
        nuclei[i].x = gunPosition.x + 30 * i - 30; // รีเซ็ตตำแหน่งนิวเคลียส
        nuclei[i].y = gunPosition.y - 30; // ตั้งไว้เหนือปืน
    }
}

// ฟังก์ชันวาดฉากหลัง
function drawBackground() {
    ctx.beginPath();
    ctx.moveTo(targetArea.x, targetArea.y + targetArea.height / 2);  // เส้นฐานกลางเป้าหมาย
    ctx.lineTo(targetArea.x + targetArea.width, targetArea.y + targetArea.height / 2);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// ฟังก์ชันวาดนิวเคลียส
function drawNuclei() {
    for (let nucleus of nuclei) {
        if (nucleus.isActive) {
            ctx.beginPath();
            ctx.arc(nucleus.x, nucleus.y, nucleus.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'blue'; // สีของนิวเคลียส
            ctx.fill();
        }
    }
}

// ฟังก์ชันวาดอนุภาค
function drawParticle() {
    if (particle) {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'red'; // สีของอนุภาค
        ctx.fill();
    }
}

// ฟังก์ชันวาดเป้ากระดาษ
function drawTargets() {
    for (let target of targets) {
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'green'; // สีของเป้ากระดาษ
        ctx.fill();
    }
}

// ฟังก์ชันวาดเส้นเล็งเป้า
let aimLine = { x1: gunPosition.x, y1: gunPosition.y, x2: gunPosition.x, y2: gunPosition.y - 100 };
function updateAimLine() {
    if (activeNucleus) {
        aimLine.x2 = activeNucleus.x;
        aimLine.y2 = activeNucleus.y;
    } else {
        aimLine.x2 = gunPosition.x; // ถ้าไม่มีนิวเคลียสให้เล็งไปที่ปืน
        aimLine.y2 = gunPosition.y - 100; // ตำแหน่งแนวตั้งให้สูงขึ้น
    }
}

function drawAimLine() {
    ctx.beginPath();
    ctx.moveTo(aimLine.x1, aimLine.y1);
    ctx.lineTo(aimLine.x2, aimLine.y2);
    ctx.strokeStyle = 'yellow'; // สีของเส้นเล็ง
    ctx.lineWidth = 1;
    ctx.stroke();
}

// ฟังก์ชันวาดปืน
function drawGun() {
    ctx.fillStyle = 'black'; // สีของปืน
    ctx.fillRect(gunPosition.x - 10, gunPosition.y, 20, 10); // ปืน
}

// ฟังก์ชันวาดคะแนน
function drawScore() {
    ctx.fillStyle = 'black';
    ctx.fillText(`คะแนน: ${score}`, 20, 20);
}

// ฟังก์ชันวาดเวลา
function drawTimer() {
    ctx.fillStyle = 'black';
    ctx.fillText(`เวลา: ${timeLeft}`, 700, 20);
}

// ฟังก์ชันอัปเดตเวลา
function updateTimer() {
    const timerInterval = setInterval(() => {
        if (isGameRunning) {
            timeLeft--;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                endGame();
            }
        }
    }, 1000);
}

// ฟังก์ชันจบเกม
function endGame() {
    isGameRunning = false;
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('restart-game').style.display = 'block';
    document.getElementById('exit').style.display = 'block';
}

// ฟังก์ชันรีเซ็ตเกม
function restartGame() {
    document.getElementById('restart-game').style.display = 'none';
    document.getElementById('exit').style.display = 'none';
    startGame();
}

// ฟังก์ชันวนลูปเกม
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // ลบภาพเก่า
    drawBackground(); // วาดฉากหลัง
    drawNuclei(); // วาดนิวเคลียส
    drawParticle(); // วาดอนุภาค
    drawTargets(); // วาดเป้ากระดาษ
    drawAimLine(); // วาดเส้นเล็งเป้า
    drawGun(); // วาดปืน
    drawScore(); // วาดคะแนน
    drawTimer(); // วาดเวลา

    // อัปเดตตำแหน่งของอนุภาค
    if (particle) {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // ตรวจสอบการชนกับเป้าหมาย
        for (let i = targets.length - 1; i >= 0; i--) {
            const target = targets[i];
            if (Math.hypot(particle.x - target.x, particle.y - target.y) < target.radius) {
                score += 10; // เพิ่มคะแนน
                targets.splice(i, 1); // ลบเป้าหมายที่โดน
                particle = null; // รีเซ็ตอนุภาค
                spawnTarget(); // สร้างเป้ากระดาษใหม่
                break; // ออกจากลูปเมื่อโดนเป้า
            }
        }

        // ตรวจสอบการชนกับนิวเคลียส
        for (const nucleus of nuclei) {
            if (Math.hypot(particle.x - nucleus.x, particle.y - nucleus.y) < nucleus.radius) {
                // คำนวณการสะท้อนหรือเบี่ยงเบน
                const dx = particle.x - nucleus.x; // ความต่างในแกน x
                const dy = particle.y - nucleus.y; // ความต่างในแกน y
                const length = Math.sqrt(dx * dx + dy * dy);

                // ถ้าอนุภาคชนกับนิวเคลียส
                if (length > 0) {
                    // ปรับความเร็วของอนุภาคตามทิศทางของนิวเคลียส
                    const reflectionAngle = Math.atan2(dy, dx) + Math.PI / 4; // เปลี่ยนทิศทางการเคลื่อนที่
                    const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
                    particle.vx = Math.cos(reflectionAngle) * speed;
                    particle.vy = Math.sin(reflectionAngle) * speed;
                }
                break; // ออกจากลูปเมื่อโดน
            }
        }

        // ตรวจสอบการชนกับฉากหลัง
        if (particle.y < targetArea.y) {
            particle = null; // รีเซ็ตอนุภาคเมื่อชนฉากหลัง
        }
    }

    // เรียกฟังก์ชัน gameLoop ทุก 16ms
    if (isGameRunning) {
        requestAnimationFrame(gameLoop);
    }
}