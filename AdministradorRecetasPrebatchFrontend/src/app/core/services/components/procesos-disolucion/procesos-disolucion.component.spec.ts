import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcesosDisolucionComponent } from './procesos-disolucion.component';

describe('ProcesosDisolucionComponent', () => {
  let component: ProcesosDisolucionComponent;
  let fixture: ComponentFixture<ProcesosDisolucionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcesosDisolucionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProcesosDisolucionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
