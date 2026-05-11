import * as THREE from 'three';

/**
 * AnimationManager - Gerencia animações, keyframes e timeline
 * Similar ao editor de animação do Blender
 */
export class AnimationManager {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        
        this.animations = new Map();     // id -> Animation
        this.currentTime = 0;
        this.isPlaying = false;
        this.frameRate = 24;
        this.startFrame = 1;
        this.endFrame = 250;
        this.currentFrame = 1;
        
        this.onFrameChange = null;
        
        console.log('AnimationManager inicializado');
    }
    
    createAnimation(name, object, property) {
        const id = `${name}_${Date.now()}`;
        const animation = {
            id,
            name,
            object,
            property,
            keyframes: [],
            isActive: true
        };
        
        this.animations.set(id, animation);
        return id;
    }
    
    addKeyframe(animationId, frame, value) {
        const animation = this.animations.get(animationId);
        if (!animation) return false;
        
        animation.keyframes.push({ frame, value });
        animation.keyframes.sort((a, b) => a.frame - b.frame);
        
        return true;
    }
    
    update() {
        if (!this.isPlaying) return;
        
        this.currentFrame++;
        if (this.currentFrame > this.endFrame) {
            this.currentFrame = this.startFrame;
        }
        
        this.currentTime = this.currentFrame / this.frameRate;
        this.applyKeyframes();
        
        if (this.onFrameChange) {
            this.onFrameChange(this.currentFrame, this.currentTime);
        }
    }
    
    applyKeyframes() {
        for (const [id, animation] of this.animations) {
            if (!animation.isActive) continue;
            if (!animation.object || !animation.object[animation.property]) continue;
            
            // Encontrar keyframes ao redor
            const keyframes = animation.keyframes;
            if (keyframes.length === 0) continue;
            
            let prev = null;
            let next = null;
            
            for (let i = 0; i < keyframes.length; i++) {
                if (keyframes[i].frame <= this.currentFrame) {
                    prev = keyframes[i];
                }
                if (keyframes[i].frame >= this.currentFrame && !next) {
                    next = keyframes[i];
                }
            }
            
            if (prev && next && prev.frame !== next.frame) {
                // Interpolação linear
                const t = (this.currentFrame - prev.frame) / (next.frame - prev.frame);
                const value = prev.value.clone().lerp(next.value, t);
                animation.object[animation.property].copy(value);
            } else if (prev) {
                animation.object[animation.property].copy(prev.value);
            }
        }
    }
    
    play() {
        this.isPlaying = true;
    }
    
    pause() {
        this.isPlaying = false;
    }
    
    stop() {
        this.isPlaying = false;
        this.currentFrame = this.startFrame;
        this.currentTime = this.currentFrame / this.frameRate;
        this.applyKeyframes();
    }
    
    goToFrame(frame) {
        this.currentFrame = Math.max(this.startFrame, Math.min(this.endFrame, frame));
        this.currentTime = this.currentFrame / this.frameRate;
        this.applyKeyframes();
    }
    
    setFrameRange(start, end) {
        this.startFrame = start;
        this.endFrame = end;
    }
    
    setFrameRate(fps) {
        this.frameRate = fps;
    }
    
    exportAnimation(animationId) {
        const animation = this.animations.get(animationId);
        if (!animation) return null;
        
        return {
            name: animation.name,
            property: animation.property,
            keyframes: animation.keyframes.map(kf => ({
                frame: kf.frame,
                value: {
                    x: kf.value.x,
                    y: kf.value.y,
                    z: kf.value.z
                }
            }))
        };
    }
    
    importAnimation(data) {
        const animation = this.createAnimation(data.name, null, data.property);
        if (animation) {
            const animObj = this.animations.get(animation);
            if (animObj) {
                data.keyframes.forEach(kf => {
                    const value = new THREE.Vector3(kf.value.x, kf.value.y, kf.value.z);
                    animObj.keyframes.push({ frame: kf.frame, value });
                });
                animObj.keyframes.sort((a, b) => a.frame - b.frame);
            }
        }
        return animation;
    }
}