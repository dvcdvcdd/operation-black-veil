import { MissionProgress, ObjectiveId } from '../types/game';

export class MissionSystem {
  private currentObjective: ObjectiveId = 'INFILTRATE';
  private extractionTimer: number = 3.0;
  private readonly extractionDuration: number = 3.0;
  private isCompleted: boolean = false;

  public readonly terminalPosition = { x: 0, z: -13.2 };
  public readonly extractionZoneZ = -28.5;

  public update(dt: number, playerPos: { x: number; z: number }): boolean {
    if (this.isCompleted) return true;

    if (this.currentObjective === 'INFILTRATE') {
      // Begitu pemain melewati pintu gerbang utama menuju aula dalam
      if (playerPos.z < -3.5) {
        this.currentObjective = 'RECOVER_DATA';
      }
    } else if (this.currentObjective === 'EXTRACT') {
      // Pemain berada di zona ekstraksi belakang fasilitas
      if (playerPos.z <= this.extractionZoneZ && Math.abs(playerPos.x) <= 6) {
        this.extractionTimer = Math.max(0, this.extractionTimer - dt);
        if (this.extractionTimer <= 0) {
          this.isCompleted = true;
          return true;
        }
      } else {
        // Reset timer jika keluar dari zona ekstraksi sebelum selesai
        this.extractionTimer = this.extractionDuration;
      }
    }

    return false;
  }

  public canInteractWithTerminal(playerPos: { x: number; z: number }): boolean {
    if (this.currentObjective !== 'RECOVER_DATA') return false;
    const dist = Math.hypot(
      playerPos.x - this.terminalPosition.x,
      playerPos.z - this.terminalPosition.z
    );
    return dist <= 3.0;
  }

  public interactWithTerminal(playerPos: { x: number; z: number }): boolean {
    if (!this.canInteractWithTerminal(playerPos)) return false;
    this.currentObjective = 'EXTRACT';
    return true;
  }

  public getProgress(): MissionProgress {
    let description = '';
    if (this.currentObjective === 'INFILTRATE') {
      description = 'OBJ 1/3: Breach Sector 9 Interior Facility';
    } else if (this.currentObjective === 'RECOVER_DATA') {
      description = 'OBJ 2/3: Recover Black-Box Data at Central Terminal [E]';
    } else if (this.currentObjective === 'EXTRACT') {
      if (this.isCompleted) {
        description = 'MISSION ACCOMPLISHED — EXTRACTION COMPLETE';
      } else {
        description = `OBJ 3/3: Hold Extraction Zone (${this.extractionTimer.toFixed(1)}s)`;
      }
    }

    return {
      currentObjective: this.currentObjective,
      description,
      extractionTimer: Number(this.extractionTimer.toFixed(2)),
      isCompleted: this.isCompleted
    };
  }

  public reset(): void {
    this.currentObjective = 'INFILTRATE';
    this.extractionTimer = this.extractionDuration;
    this.isCompleted = false;
  }
}