export class TranscriptInfo {
  userId: string;
  meetingId: string;
  transcriptId: string;

  constructor(userId?: string, meetingId?: string, transcriptId?: string) {
    this.userId = userId;
    this.meetingId = meetingId;
    this.transcriptId = transcriptId;
  }

  toString(): string {
    return `TranscriptInfo{userId='${this.userId}', meetingId='${this.meetingId}', transcriptId='${this.transcriptId}'}`;
  }
}