import {ChatAdapter, Message, ParticipantResponse} from 'ng-chat';
import {Observable} from "rxjs";

export class MyAdapter extends ChatAdapter {
  getMessageHistory(destinataryId: any): Observable<Message[]> {
    return undefined;
  }

  listFriends(): Observable<ParticipantResponse[]> {
    return undefined;
  }

  sendMessage(message: Message): void {
  }

}
