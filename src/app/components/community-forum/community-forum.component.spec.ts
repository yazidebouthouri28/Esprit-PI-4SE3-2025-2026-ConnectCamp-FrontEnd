import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { CommunityForumComponent } from './community-forum.component';
import { AuthService } from '../../services/auth.service';
import { UserService, User } from '../../services/user.service';

describe('CommunityForumComponent', () => {
  let component: CommunityForumComponent;
  let fixture: ComponentFixture<CommunityForumComponent>;
  let httpMock: HttpTestingController;

  const routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
  const authServiceStub = {} as AuthService;

  const userServiceSpy = jasmine.createSpyObj<UserService>('UserService', ['getCurrentUser']);
  const currentUser: User = {
    id: '123',
    name: 'Real User',
    avatar: '',
    role: 'USER'
  };

  beforeEach(async () => {
    userServiceSpy.getCurrentUser.and.returnValue(currentUser);

    await TestBed.configureTestingModule({
      imports: [CommunityForumComponent, HttpClientTestingModule],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authServiceStub },
        { provide: UserService, useValue: userServiceSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CommunityForumComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should map chat rooms into recentChats', () => {
    fixture.detectChanges(); // triggers ngOnInit -> loadChatRooms

    const req = httpMock.expectOne('/api/chat-rooms/user/123');
    expect(req.request.method).toBe('GET');

    req.flush({
      success: true,
      data: {
        content: [
          {
            id: '1',
            name: 'Room1',
            avatar: '',
            lastMessage: 'Hello',
            lastMessageAt: '2020-01-01T10:00:00.000Z',
            type: 'PRIVATE',
            unreadCount: 2,
            description: 'Room desc',
            memberCount: 7
          }
        ]
      }
    });

    expect(component.recentChats.length).toBe(1);

    const mapped = component.recentChats[0];
    expect(mapped.id).toBe('1');
    expect(mapped.name).toBe('Room1');
    expect(mapped.avatar).toBe('https://ui-avatars.com/api/?name=Room1&background=random');
    expect(mapped.lastMessage).toBe('Hello');
    expect(mapped.type).toBe('private');
    expect(mapped.unread).toBe(2);
    expect(mapped.description).toBe('Room desc');
    expect(mapped.membersCount).toBe(7);

    // Locale/timezone dependent formatting: just ensure we got a plausible time string.
    expect(mapped.time).toMatch(/\d{1,2}:\d{2}/);

    // Since the first recent chat is not a GROUP, switchChat() should not be triggered.
    expect(component.activeGroup?.id).toBe('g1');
  });
});

