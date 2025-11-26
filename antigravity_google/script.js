class PhysicsObject {
    constructor(element) {
        this.element = element;
        this.rect = element.getBoundingClientRect();

        // Random initial position
        const startX = (window.innerWidth - this.rect.width) * 0.5 + (Math.random() - 0.5) * 400;
        const startY = (window.innerHeight - this.rect.height) * 0.5 + (Math.random() - 0.5) * 200;

        this.pos = { x: startX, y: startY };

        // Random velocity (drift)
        this.vel = {
            x: (Math.random() - 0.5) * 1.5,
            y: (Math.random() - 0.5) * 1.5
        };

        // Rotation
        this.angle = Math.random() * 360;
        this.rotVel = (Math.random() - 0.5) * 0.5;

        // Physical properties
        this.width = this.rect.width;
        this.height = this.rect.height;

        // Better radius for collision
        const aspectRatio = Math.max(this.width, this.height) / Math.min(this.width, this.height);
        if (aspectRatio > 2) {
            this.radius = Math.min(this.width, this.height);
        } else {
            this.radius = Math.max(this.width, this.height) / 2;
        }

        this.mass = this.width * this.height * 0.001;

        // Mouse interaction
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };

        this.initEvents();
    }

    initEvents() {
        this.element.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.dragOffset.x = e.clientX - this.pos.x;
            this.dragOffset.y = e.clientY - this.pos.y;
            this.element.style.cursor = 'grabbing';
            this.rotVel = 0;
            this.vel = { x: 0, y: 0 };
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.pos.x = e.clientX - this.dragOffset.x;
                this.pos.y = e.clientY - this.dragOffset.y;
                this.vel.x = e.movementX;
                this.vel.y = e.movementY;
            }
        });

        window.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.element.style.cursor = 'grab';
                this.rotVel = (Math.random() - 0.5) * 2;
            }
        });
    }

    update(mousePos) {
        if (!this.isDragging) {
            this.pos.x += this.vel.x;
            this.pos.y += this.vel.y;
            this.angle += this.rotVel;

            // Mouse Repulsion
            if (mousePos) {
                const dx = (this.pos.x + this.width / 2) - mousePos.x;
                const dy = (this.pos.y + this.height / 2) - mousePos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const repulsionRadius = 300;

                if (dist < repulsionRadius) {
                    const force = (repulsionRadius - dist) / repulsionRadius;
                    const angle = Math.atan2(dy, dx);
                    this.vel.x += Math.cos(angle) * force * 0.2;
                    this.vel.y += Math.sin(angle) * force * 0.2;
                }
            }

            // Friction/Damping
            this.vel.x *= 0.99;
            this.vel.y *= 0.99;

            // Wall bouncing
            if (this.pos.x < 0) {
                this.pos.x = 0;
                this.vel.x *= -1;
            }
            if (this.pos.x + this.width > window.innerWidth) {
                this.pos.x = window.innerWidth - this.width;
                this.vel.x *= -1;
            }
            if (this.pos.y < 0) {
                this.pos.y = 0;
                this.vel.y *= -1;
            }
            if (this.pos.y + this.height > window.innerHeight) {
                this.pos.y = window.innerHeight - this.height;
                this.vel.y *= -1;
            }
        }

        this.render();
    }

    render() {
        this.element.style.transform = `translate(${this.pos.x}px, ${this.pos.y}px) rotate(${this.angle}deg)`;
    }
}

class AntigravityEngine {
    constructor() {
        this.objects = [];
        this.mousePos = { x: -1000, y: -1000 };
        this.init();
        this.animate();
    }

    init() {
        const elements = document.querySelectorAll('.floater');
        elements.forEach(el => {
            this.objects.push(new PhysicsObject(el));
        });

        window.addEventListener('mousemove', (e) => {
            this.mousePos.x = e.clientX;
            this.mousePos.y = e.clientY;
        });
    }

    checkCollisions() {
        for (let i = 0; i < this.objects.length; i++) {
            for (let j = i + 1; j < this.objects.length; j++) {
                const obj1 = this.objects[i];
                const obj2 = this.objects[j];

                const dx = (obj1.pos.x + obj1.width / 2) - (obj2.pos.x + obj2.width / 2);
                const dy = (obj1.pos.y + obj1.height / 2) - (obj2.pos.y + obj2.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = (obj1.radius + obj2.radius) * 0.8;

                if (distance < minDistance) {
                    this.resolveCollision(obj1, obj2, dx, dy, distance);
                }
            }
        }
    }

    resolveCollision(obj1, obj2, dx, dy, distance) {
        const nx = dx / distance;
        const ny = dy / distance;

        const dvx = obj1.vel.x - obj2.vel.x;
        const dvy = obj1.vel.y - obj2.vel.y;

        const velAlongNormal = dvx * nx + dvy * ny;

        if (velAlongNormal > 0) return;

        const e = 0.8;

        let j = -(1 + e) * velAlongNormal;
        j /= (1 / obj1.mass + 1 / obj2.mass);

        const impulseX = j * nx;
        const impulseY = j * ny;

        if (!obj1.isDragging) {
            obj1.vel.x += (1 / obj1.mass) * impulseX;
            obj1.vel.y += (1 / obj1.mass) * impulseY;
            obj1.rotVel += (Math.random() - 0.5) * 0.5;
        }
        if (!obj2.isDragging) {
            obj2.vel.x -= (1 / obj2.mass) * impulseX;
            obj2.vel.y -= (1 / obj2.mass) * impulseY;
            obj2.rotVel += (Math.random() - 0.5) * 0.5;
        }

        const overlap = (obj1.radius + obj2.radius) * 0.8 - distance;
        if (overlap > 0) {
            const correctionX = (overlap / (1 / obj1.mass + 1 / obj2.mass)) * nx * 0.2;
            const correctionY = (overlap / (1 / obj1.mass + 1 / obj2.mass)) * ny * 0.2;

            if (!obj1.isDragging) {
                obj1.pos.x += correctionX * (1 / obj1.mass);
                obj1.pos.y += correctionY * (1 / obj1.mass);
            }
            if (!obj2.isDragging) {
                obj2.pos.x -= correctionX * (1 / obj2.mass);
                obj2.pos.y -= correctionY * (1 / obj2.mass);
            }
        }
    }

    animate() {
        this.checkCollisions();
        this.objects.forEach(obj => obj.update(this.mousePos));
        requestAnimationFrame(() => this.animate());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const engine = new AntigravityEngine();
});
