import {Component, OnInit} from '@angular/core';
import {ChartType, ChartOptions} from 'chart.js';
import {Label} from 'ng2-charts';
import * as pluginDataLabels from 'chartjs-plugin-datalabels';

@Component({
  selector: 'app-manager',
  templateUrl: './controller.component.html',
  styleUrls: ['./controller.component.scss']
})
export class ControllerComponent implements OnInit {
  public ChartOptions: ChartOptions = {
    responsive: true,
    legend: {
      position: 'top',
    },
    plugins: {
      datalabels: {
        formatter: (value, ctx) => {
          const label = ctx.chart.data.labels[ctx.dataIndex];
          return label;
        },
      },
    }
  };
  public ChartLabels: Label[] = ['Benzinekosten', 'Parkeerkosten', 'Reiskosten', 'Overig'];
  public ChartData: number[] = [220, 200, 136, 130];
  public ChartType = 'pie';
  public ChartLegend = true;
  public ChartPlugins = [pluginDataLabels];
  public ChartColors = [
    {
      backgroundColor: ['rgba(255,0,0,0.3)', 'rgba(247,255,0,0.3)', 'rgba(0,255,222,0.3)', 'rgba(228,0,255,0.3)'],
    },
  ];

  constructor() {
  }

  ngOnInit() {
  }

  setChart(chart) {
    document.getElementsByClassName('active')[0].classList.remove('active');
    chart.target.className += ' active';
    this.ChartType = chart.target.name; // Raw Data will return error
  }

}
