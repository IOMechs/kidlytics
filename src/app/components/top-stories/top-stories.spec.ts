import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopStoriesComponent } from './top-stories';

describe('TopStoriesComponent', () => {
  let component: TopStoriesComponent;
  let fixture: ComponentFixture<TopStoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ TopStoriesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopStoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
