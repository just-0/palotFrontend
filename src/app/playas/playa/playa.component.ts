import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CurrentPlayaService } from '../../services/current-playa.service';
import { interval } from 'rxjs';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-playa',
  templateUrl: './playa.component.html',
  styleUrl: './playa.component.css'
})
export class PlayaComponent implements OnInit, OnDestroy{
  constructor(private currentPlayaService: CurrentPlayaService){}

  Playa: any = null;
  public fechaHora: Date = new Date();
  private subscription: Subscription = new Subscription();
  ngOnInit(): void {
      this.Playa = this.currentPlayaService.getCurrentPlaya();
      this.subscription.add(
        interval(1000).subscribe(() => {
          this.fechaHora = new Date();
        })
      );
  }
  ngOnDestroy() {
    
    this.subscription.unsubscribe();
  }
  
  
}
 