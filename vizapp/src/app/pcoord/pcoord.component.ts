import {AfterViewInit, Component, OnInit, ViewEncapsulation} from '@angular/core';
import * as d3 from 'd3';
import {GrandTour} from '../zava.core';

@Component({
  selector: 'app-pcoord',
  templateUrl: './pcoord.component.html',
  styleUrls: ['./pcoord.component.scss']
})
export class PcoordComponent implements OnInit, AfterViewInit {

  data: {headers: Array<string>, data: Array<Array<number>>, colors: Array<string>};

  marginTop = 50;
  marginBottom = 10;
  marginRight = 10;
  marginLeft = 50;
  totalWidth = 960;
  totalHeight = 500;

  lineAttrs = new Map<string, string>([
    ['fill', 'none'],
    ['shape-rendering', 'crispEdges']
  ]);

  axisLabelAttrs = new Map<string, string>([
    ['text-anchor', 'middle'],
    ['y', '-9'],
    ['text-shadow', '0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff'],
    ['cursor', 'move'],
    ['fill', 'black']
  ]);

  xScaler: any;
  yScalers: any;

  degree = 0;
  degreeDelta = 0.5;
  grandTour: GrandTour;

  constructor() {
    this.data = this.getData();
    this.grandTour = new GrandTour(this.data.data);
    this.data.data = this.grandTour.rotate(this.degree);
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    const margin = {
      top: this.marginTop,
      bottom: this.marginBottom,
      left: this.marginLeft,
      right: this.marginRight
    };

    const width = this.totalWidth - margin.left - margin.right;
    const height = this.totalHeight - margin.top - margin.bottom;

    const xScaler = d3.scaleLinear([0, this.data.headers.length], [0, width]);
    const yScalers = new Map<number, any>(this.data.headers.map((header, i) => {
      const domain = d3.extent(this.data.data, (row) => row[i]) as [number, number];
      const range = [height, 0];
      return [i, d3.scaleLinear(domain, range)];
    }));
    this.xScaler = xScaler;
    this.yScalers = yScalers;

    const svg = d3.select('div#zavaDisplay')
      .append('svg')
      .attr('id', 'zavaSvg')
      .attr('width', this.totalWidth)
      .attr('height', this.totalHeight)
      .attr('font', '10px sans-serif')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const line = d3.line();
    const toCoord = (v: number, c: number) => [xScaler(c), yScalers.get(c)(v)];
    const rowToCoord = (row: number[]) => row.map((v, c) => toCoord(v, c));
    const rowToLine = (row: number[]) => {
      const data = rowToCoord(row) as [number, number][];
      return line(data);
    };

    svg.append('g')
      .attr('class', 'lines')
      .selectAll('path')
      .data(this.data.data)
      .enter()
      .append('path')
      .attr('class', 'line-path')
      .attr('d', (row) => rowToLine(row))
      .attr('stroke', (row, index) => this.data.colors[index])
      .each((data, index, group) => {
        const item = d3.select(group[index]);
        for (const k of this.lineAttrs.keys()) {
          const v = this.lineAttrs.get(k) as string;
          item.attr(k, v);
        }
      });

    const dimensions = yScalers.values();
    const g = svg.selectAll('.dimension')
      .data(dimensions)
      .enter()
      .append('g')
      .attr('class', 'dimension')
      .attr('transform', (h, i) => `translate(${xScaler(i)})`);

    const axis = d3.axisLeft(d3.scaleLinear([0, this.data.headers.length], [0, width]));
    g.append('g')
      .attr('class', 'axis')
      .each((data, index, group) => {
        d3.select(group[index]).call(axis.scale(yScalers.get(index)));
      })
      .append('text')
      .text((e, i) => this.data.headers[i])
      .each((data, index, group) => {
        const item = d3.select(group[index]);
        for (const k of this.axisLabelAttrs.keys()) {
          const v = this.axisLabelAttrs.get(k) as string;
          item.attr(k, v);
        }
      });
  }

  private getData(): {headers: Array<string>, data: Array<Array<number>>, colors: Array<string>} {
    const headers = 'economy_mpg,cylinders,displacement_cc,power_hp,weight_lb,0_60_mph_s,year'
      .split(',')
      .map(token => token.trim().toLowerCase());

    const data = this.getCsv().split('\n')
      .map(line => line.split(','))
      .map(tokens => tokens.filter((v, i) => i > 0))
      .map(tokens => tokens.map(v => v.trim()))
      .map(tokens => tokens.map(v => +v));
    const items = data.slice(0, 3);

    const colors = data.map((rows) => rows[1] < 6.0 ? '#e0e0e0' : 'steelblue');

    return {headers, data, colors};
  }

  private getCsv(): string {
    return 'AMC Ambassador Brougham,13,8,360,175,3821,11,73\n' +
      'AMC Ambassador DPL,15,8,390,190,3850,8.5,70\n' +
      'AMC Ambassador SST,17,8,304,150,3672,11.5,72\n' +
      'AMC Concord DL 6,20.2,6,232,90,3265,18.2,79\n' +
      'AMC Concord DL,18.1,6,258,120,3410,15.1,78\n' +
      'AMC Concord DL,23,4,151,,3035,20.5,82\n' +
      'AMC Concord,19.4,6,232,90,3210,17.2,78\n' +
      'AMC Concord,24.3,4,151,90,3003,20.1,80\n' +
      'AMC Gremlin,18,6,232,100,2789,15,73\n' +
      'AMC Gremlin,19,6,232,100,2634,13,71\n' +
      'AMC Gremlin,20,6,232,100,2914,16,75\n' +
      'AMC Gremlin,21,6,199,90,2648,15,70\n' +
      'AMC Hornet Sportabout (Wagon),18,6,258,110,2962,13.5,71\n' +
      'AMC Hornet,18,6,199,97,2774,15.5,70\n' +
      'AMC Hornet,18,6,232,100,2945,16,73\n' +
      'AMC Hornet,19,6,232,100,2901,16,74\n' +
      'AMC Hornet,22.5,6,232,90,3085,17.6,76\n' +
      'AMC Matador (Wagon),14,8,304,150,4257,15.5,74\n' +
      'AMC Matador (Wagon),15,8,304,150,3892,12.5,72\n' +
      'AMC Matador,14,8,304,150,3672,11.5,73\n' +
      'AMC Matador,15,6,258,110,3730,19,75\n' +
      'AMC Matador,15.5,8,304,120,3962,13.9,76\n' +
      'AMC Matador,16,6,258,110,3632,18,74\n' +
      'AMC Matador,18,6,232,100,3288,15.5,71\n' +
      'AMC Pacer D/L,17.5,6,258,95,3193,17.8,76\n' +
      'AMC Pacer,19,6,232,90,3211,17,75\n' +
      'AMC Rebel SST (Wagon),,8,360,175,3850,11,70\n' +
      'AMC Rebel SST,16,8,304,150,3433,12,70\n' +
      'AMC Spirit DL,27.4,4,121,80,2670,15,79\n' +
      'Audi 100 LS,20,4,114,91,2582,14,73\n' +
      'Audi 100 LS,23,4,115,95,2694,15,75\n' +
      'Audi 100 LS,24,4,107,90,2430,14.5,70\n' +
      'Audi 4000,34.3,4,97,78,2188,15.8,80\n' +
      'Audi 5000,20.3,5,131,103,2830,15.9,78\n' +
      'Audi 5000S (Diesel),36.4,5,121,67,2950,19.9,80\n' +
      'Audi Fox,29,4,98,83,2219,16.5,74\n' +
      'BMW 2002,26,4,121,113,2234,12.5,70\n' +
      'BMW 320i,21.5,4,121,110,2600,12.8,77\n' +
      'Buick Century 350,13,8,350,175,4100,13,73\n' +
      'Buick Century Limited,25,6,181,110,2945,16.4,82\n' +
      'Buick Century Luxus (Wagon),13,8,350,150,4699,14.5,74\n' +
      'Buick Century Special,20.6,6,231,105,3380,15.8,78\n' +
      'Buick Century,17,6,231,110,3907,21,75\n' +
      'Buick Century,22.4,6,231,110,3415,15.8,81\n' +
      'Buick Electra 225 Custom,12,8,455,225,4951,11,73\n' +
      'Buick Estate Wagon (Wagon),14,8,455,225,3086,10,70\n' +
      'Buick Estate Wagon (Wagon),16.9,8,350,155,4360,14.9,79\n' +
      'Buick Lesabre Custom,13,8,350,155,4502,13.5,72\n' +
      'Buick Opel Isuzu Deluxe,30,4,111,80,2155,14.8,77\n' +
      'Buick Regal Sport Coupe (Turbo),17.7,6,231,165,3445,13.4,78\n' +
      'Buick Skyhawk,21,6,231,110,3039,15,75\n' +
      'Buick Skylark 320,15,8,350,165,3693,11.5,70\n' +
      'Buick Skylark Limited,28.4,4,151,90,2670,16,79\n' +
      'Buick Skylark,20.5,6,231,105,3425,16.9,77\n' +
      'Buick Skylark,26.6,4,151,84,2635,16.4,81\n' +
      'Cadillac Eldorado,23,8,350,125,3900,17.4,79\n' +
      'Cadillac Seville,16.5,8,350,180,4380,12.1,76\n' +
      'Chevroelt Chevelle Malibu,16,6,250,105,3897,18.5,75\n' +
      'Chevrolet Bel Air,15,8,350,145,4440,14,75\n' +
      'Chevrolet Camaro,27,4,151,90,2950,17.3,82\n' +
      'Chevrolet Caprice Classic,13,8,400,150,4464,12,73\n' +
      'Chevrolet Caprice Classic,17,8,305,130,3840,15.4,79\n' +
      'Chevrolet Caprice Classic,17.5,8,305,145,3880,12.5,77\n' +
      'Chevrolet Cavalier 2-Door,34,4,112,88,2395,18,82\n' +
      'Chevrolet Cavalier Wagon,27,4,112,88,2640,18.6,82\n' +
      'Chevrolet Cavalier,28,4,112,88,2605,19.6,82\n' +
      'Chevrolet Chevelle Concours (Wagon),,8,350,165,4142,11.5,70\n' +
      'Chevrolet Chevelle Concours (Wagon),13,8,307,130,4098,14,72\n' +
      'Chevrolet Chevelle Malibu Classic,16,6,250,100,3781,17,74\n' +
      'Chevrolet Chevelle Malibu Classic,17.5,8,305,140,4215,13,76\n' +
      'Chevrolet Chevelle Malibu,17,6,250,100,3329,15.5,71\n' +
      'Chevrolet Chevelle Malibu,18,8,307,130,3504,12,70\n' +
      'Chevrolet Chevette,29,4,85,52,2035,22.2,76\n' +
      'Chevrolet Chevette,30,4,98,68,2155,16.5,78\n' +
      'Chevrolet Chevette,30.5,4,98,63,2051,17,77\n' +
      'Chevrolet Chevette,32.1,4,98,70,2120,15.5,80\n' +
      'Chevrolet Citation,23.5,6,173,110,2725,12.6,81\n' +
      'Chevrolet Citation,28,4,151,90,2678,16.5,80\n' +
      'Chevrolet Citation,28.8,6,173,115,2595,11.3,79\n' +
      'Chevrolet Concours,17.5,6,250,110,3520,16.4,77\n' +
      'Chevrolet Impala,11,8,400,150,4997,14,73\n' +
      'Chevrolet Impala,13,8,350,165,4274,12,72\n' +
      'Chevrolet Impala,14,8,350,165,4209,12,71\n' +
      'Chevrolet Impala,14,8,454,220,4354,9,70\n' +
      'Chevrolet Malibu Classic (Wagon),19.2,8,267,125,3605,15,79\n' +
      'Chevrolet Malibu,13,8,350,145,3988,13,73\n' +
      'Chevrolet Malibu,20.5,6,200,95,3155,18.2,78\n' +
      'Chevrolet Monte Carlo Landau,15.5,8,350,170,4165,11.4,77\n' +
      'Chevrolet Monte Carlo Landau,19.2,8,305,145,3425,13.2,78\n' +
      'Chevrolet Monte Carlo S,15,8,350,145,4082,13,73\n' +
      'Chevrolet Monte Carlo,15,8,400,150,3761,9.5,70\n' +
      'Chevrolet Monza 2+2,20,8,262,110,3221,13.5,75\n' +
      'Chevrolet Nova Custom,16,6,250,100,3278,18,73\n' +
      'Chevrolet Nova,15,6,250,100,3336,17,74\n' +
      'Chevrolet Nova,18,6,250,105,3459,16,75\n' +
      'Chevrolet Nova,22,6,250,105,3353,14.5,76\n' +
      'Chevrolet Vega (Wagon),22,4,140,72,2408,19,71\n' +
      'Chevrolet Vega 2300,28,4,140,90,2264,15.5,71\n' +
      'Chevrolet Vega,20,4,140,90,2408,19.5,72\n' +
      'Chevrolet Vega,21,4,140,72,2401,19.5,73\n' +
      'Chevrolet Vega,25,4,140,75,2542,17,74\n' +
      'Chevrolet Woody,24.5,4,98,60,2164,22.1,76\n' +
      'Chevy C10,13,8,350,145,4055,12,76\n' +
      'Chevy C20,10,8,307,200,4376,15,70\n' +
      'Chevy S-10,31,4,119,82,2720,19.4,82\n' +
      'Chrysler Cordoba,15.5,8,400,190,4325,12.2,77\n' +
      'Chrysler Lebaron Medallion,26,4,156,92,2585,14.5,82\n' +
      'Chrysler Lebaron Salon,17.6,6,225,85,3465,16.6,81\n' +
      'Chrysler Lebaron Town & Country (Wagon),18.5,8,360,150,3940,13,79\n' +
      'Chrysler New Yorker Brougham,13,8,440,215,4735,11,73\n' +
      'Chrysler Newport Royal,13,8,400,190,4422,12.5,72\n' +
      'Citroen DS-21 Pallas,,4,133,115,3090,17.5,70\n' +
      'Datsun 1200,35,4,72,69,1613,18,71\n' +
      'Datsun 200SX,23.9,4,119,97,2405,14.9,78\n' +
      'Datsun 200SX,32.9,4,119,100,2615,14.8,81\n' +
      'Datsun 210,31.8,4,85,65,2020,19.2,79\n' +
      'Datsun 210,37,4,85,65,1975,19.4,81\n' +
      'Datsun 210,40.8,4,85,65,2110,19.2,80\n' +
      'Datsun 280ZX,32.7,6,168,132,2910,11.4,80\n' +
      'Datsun 310 GX,38,4,91,67,1995,16.2,82\n' +
      'Datsun 310,37.2,4,86,65,2019,16.4,80\n' +
      'Datsun 510 (Wagon),28,4,97,92,2288,17,72\n' +
      'Datsun 510 Hatchback,37,4,119,92,2434,15,80\n' +
      'Datsun 510,27.2,4,119,97,2300,14.7,78\n' +
      'Datsun 610,22,4,108,94,2379,16.5,73\n' +
      'Datsun 710,24,4,119,97,2545,17,75\n' +
      'Datsun 710,32,4,83,61,2003,19,74\n' +
      'Datsun 810 Maxima,24.2,6,146,120,2930,13.8,81\n' +
      'Datsun 810,22,6,146,97,2815,14.5,77\n' +
      'Datsun B-210,32,4,85,70,1990,17,76\n' +
      'Datsun B210 GX,39.4,4,85,70,2070,18.6,78\n' +
      'Datsun B210,31,4,79,67,1950,19,74\n' +
      'Datsun F-10 Hatchback,33.5,4,85,70,1945,16.8,77\n' +
      'Datsun PL510,27,4,97,88,2130,14.5,70\n' +
      'Datsun PL510,27,4,97,88,2130,14.5,71\n' +
      'Dodge Aries SE,29,4,135,84,2525,16,82\n' +
      'Dodge Aries Wagon (Wagon),25.8,4,156,92,2620,14.4,81\n' +
      'Dodge Aspen 6,20.6,6,225,110,3360,16.6,79\n' +
      'Dodge Aspen SE,20,6,225,100,3651,17.7,76\n' +
      'Dodge Aspen,18.6,6,225,110,3620,18.7,78\n' +
      'Dodge Aspen,19.1,6,225,90,3381,18.7,80\n' +
      'Dodge Challenger SE,15,8,383,170,3563,10,70\n' +
      'Dodge Charger 2.2,36,4,135,84,2370,13,82\n' +
      'Dodge Colt (Wagon),28,4,98,80,2164,15,72\n' +
      'Dodge Colt Hardtop,25,4,97.5,80,2126,17,72\n' +
      'Dodge Colt Hatchback Custom,35.7,4,98,80,1915,14.4,79\n' +
      'Dodge Colt M/M,33.5,4,98,83,2075,15.9,77\n' +
      'Dodge Colt,26,4,98,79,2255,17.7,76\n' +
      'Dodge Colt,27.9,4,156,105,2800,14.4,80\n' +
      'Dodge Colt,28,4,90,75,2125,14.5,74\n' +
      'Dodge Coronet Brougham,16,8,318,150,4190,13,76\n' +
      'Dodge Coronet Custom (Wagon),14,8,318,150,4457,13.5,74\n' +
      'Dodge Coronet Custom,15,8,318,150,3777,12.5,73\n' +
      'Dodge D100,13,8,318,150,3755,14,76\n' +
      'Dodge D200,11,8,318,210,4382,13.5,70\n' +
      'Dodge Dart Custom,15,8,318,150,3399,11,73\n' +
      'Dodge Diplomat,19.4,8,318,140,3735,13.2,78\n' +
      'Dodge Magnum XE,17.5,8,318,140,4080,13.7,78\n' +
      'Dodge Monaco (Wagon),12,8,383,180,4955,11.5,71\n' +
      'Dodge Monaco Brougham,15.5,8,318,145,4140,13.7,77\n' +
      'Dodge Omni,30.9,4,105,75,2230,14.5,78\n' +
      'Dodge Rampage,32,4,135,84,2295,11.6,82\n' +
      'Dodge St. Regis,18.2,8,318,135,3830,15.2,79\n' +
      'Fiat 124 Sport Coupe,26,4,98,90,2265,15.5,73\n' +
      'Fiat 124 TC,26,4,116,75,2246,14,74\n' +
      'Fiat 124B,30,4,88,76,2065,14.5,71\n' +
      'Fiat 128,24,4,90,75,2108,15.5,74\n' +
      'Fiat 128,29,4,68,49,1867,19.5,73\n' +
      'Fiat 131,28,4,107,86,2464,15.5,76\n' +
      'Fiat Strada Custom,37.3,4,91,69,2130,14.7,79\n' +
      'Fiat X1.9,31,4,79,67,2000,16,74\n' +
      'Ford Capri II,25,4,140,92,2572,14.9,76\n' +
      'Ford Country Squire (Wagon),13,8,400,170,4746,12,71\n' +
      'Ford Country Squire (Wagon),15.5,8,351,142,4054,14.3,79\n' +
      'Ford Country,12,8,400,167,4906,12.5,73\n' +
      'Ford Escort 2H,29.9,4,98,65,2380,20.7,81\n' +
      'Ford Escort 4W,34.4,4,98,65,2045,16.2,81\n' +
      'Ford F108,13,8,302,130,3870,15,76\n' +
      'Ford F250,10,8,360,215,4615,14,70\n' +
      'Ford Fairmont (Auto),20.2,6,200,85,2965,15.8,78\n' +
      'Ford Fairmont (Man),25.1,4,140,88,2720,15.4,78\n' +
      'Ford Fairmont 4,22.3,4,140,88,2890,17.3,79\n' +
      'Ford Fairmont Futura,24,4,140,92,2865,16.4,82\n' +
      'Ford Fairmont,26.4,4,140,88,2870,18.1,80\n' +
      'Ford Fiesta,36.1,4,98,66,1800,14.4,78\n' +
      'Ford Futura,18.1,8,302,139,3205,11.2,78\n' +
      'Ford Galaxie 500,14,8,351,153,4129,13,72\n' +
      'Ford Galaxie 500,14,8,351,153,4154,13.5,71\n' +
      'Ford Galaxie 500,15,8,429,198,4341,10,70\n' +
      'Ford Gran Torino (Wagon),13,8,302,140,4294,16,72\n' +
      'Ford Gran Torino (Wagon),14,8,302,140,4638,16,74\n' +
      'Ford Gran Torino,14,8,302,137,4042,14.5,73\n' +
      'Ford Gran Torino,14.5,8,351,152,4215,12.8,76\n' +
      'Ford Gran Torino,16,8,302,140,4141,14,74\n' +
      'Ford Granada Ghia,18,6,250,78,3574,21,76\n' +
      'Ford Granada GL,20.2,6,200,88,3060,17.1,81\n' +
      'Ford Granada L,22,6,232,112,2835,14.7,82\n' +
      'Ford Granada,18.5,6,250,98,3525,19,77\n' +
      'Ford LTD Landau,17.6,8,302,129,3725,13.4,79\n' +
      'Ford LTD,13,8,351,158,4363,13,73\n' +
      'Ford LTD,14,8,351,148,4657,13.5,75\n' +
      'Ford Maverick,15,6,250,72,3158,19.5,75\n' +
      'Ford Maverick,18,6,250,88,3021,16.5,73\n' +
      'Ford Maverick,21,6,200,,2875,17,74\n' +
      'Ford Maverick,21,6,200,85,2587,16,70\n' +
      'Ford Maverick,24,6,200,81,3012,17.6,76\n' +
      'Ford Mustang Boss 302,,8,302,140,3353,8,70\n' +
      'Ford Mustang Cobra,23.6,4,140,,2905,14.3,80\n' +
      'Ford Mustang GL,27,4,140,86,2790,15.6,82\n' +
      'Ford Mustang II 2+2,25.5,4,140,89,2755,15.8,77\n' +
      'Ford Mustang II,13,8,302,129,3169,12,75\n' +
      'Ford Mustang,18,6,250,88,3139,14.5,71\n' +
      'Ford Pinto (Wagon),22,4,122,86,2395,16,72\n' +
      'Ford Pinto Runabout,21,4,122,86,2226,16.5,72\n' +
      'Ford Pinto,18,6,171,97,2984,14.5,75\n' +
      'Ford Pinto,19,4,122,85,2310,18.5,73\n' +
      'Ford Pinto,23,4,140,83,2639,17,75\n' +
      'Ford Pinto,25,4,98,,2046,19,71\n' +
      'Ford Pinto,26,4,122,80,2451,16.5,74\n' +
      'Ford Pinto,26.5,4,140,72,2565,13.6,76\n' +
      'Ford Ranger,28,4,120,79,2625,18.6,82\n' +
      'Ford Thunderbird,16,8,351,149,4335,14.5,77\n' +
      'Ford Torino (Wagon),,8,351,153,4034,11,70\n' +
      'Ford Torino 500,19,6,250,88,3302,15.5,71\n' +
      'Ford Torino,17,8,302,140,3449,10.5,70\n' +
      'Hi 1200D,9,8,304,193,4732,18.5,70\n' +
      'Honda Accord CVCC,31.5,4,98,68,2045,18.5,77\n' +
      'Honda Accord LX,29.5,4,98,68,2135,16.6,78\n' +
      'Honda Accord,32.4,4,107,72,2290,17,80\n' +
      'Honda Accord,36,4,107,75,2205,14.5,82\n' +
      'Honda Civic (Auto),32,4,91,67,1965,15.7,82\n' +
      'Honda Civic 1300,35.1,4,81,60,1760,16.1,81\n' +
      'Honda Civic 1500 GL,44.6,4,91,67,1850,13.8,80\n' +
      'Honda Civic CVCC,33,4,91,53,1795,17.5,75\n' +
      'Honda Civic CVCC,36.1,4,91,60,1800,16.4,78\n' +
      'Honda Civic,24,4,120,97,2489,15,74\n' +
      'Honda Civic,33,4,91,53,1795,17.4,76\n' +
      'Honda Civic,38,4,91,67,1965,15,82\n' +
      'Honda Prelude,33.7,4,107,75,2210,14.4,81\n' +
      'Maxda GLC Deluxe,34.1,4,86,65,1975,15.2,79\n' +
      'Maxda RX-3,18,3,70,90,2124,13.5,73\n' +
      'Mazda 626,31.3,4,120,75,2542,17.5,80\n' +
      'Mazda 626,31.6,4,120,74,2635,18.3,81\n' +
      'Mazda GLC 4,34.1,4,91,68,1985,16,81\n' +
      'Mazda GLC Custom L,37,4,91,68,2025,18.2,82\n' +
      'Mazda GLC Custom,31,4,91,68,1970,17.6,82\n' +
      'Mazda GLC Deluxe,32.8,4,78,52,1985,19.4,78\n' +
      'Mazda GLC,46.6,4,86,65,2110,17.9,80\n' +
      'Mazda RX-2 Coupe,19,3,70,97,2330,13.5,72\n' +
      'Mazda RX-4,21.5,3,80,110,2720,13.5,77\n' +
      'Mazda RX-7 Gs,23.7,3,70,100,2420,12.5,80\n' +
      'Mercedes-Benz 240D,30,4,146,67,3250,21.8,80\n' +
      'Mercedes-Benz 280S,16.5,6,168,120,3820,16.7,76\n' +
      'Mercedes-Benz 300D,25.4,5,183,77,3530,20.1,79\n' +
      'Mercury Capri 2000,23,4,122,86,2220,14,71\n' +
      'Mercury Capri V6,21,6,155,107,2472,14,73\n' +
      'Mercury Cougar Brougham,15,8,302,130,4295,14.9,77\n' +
      'Mercury Grand Marquis,16.5,8,351,138,3955,13.2,79\n' +
      'Mercury Lynx L,36,4,98,70,2125,17.3,82\n' +
      'Mercury Marquis Brougham,12,8,429,198,4952,11.5,73\n' +
      'Mercury Marquis,11,8,429,208,4633,11,72\n' +
      'Mercury Monarch Ghia,20.2,8,302,139,3570,12.8,78\n' +
      'Mercury Monarch,15,6,250,72,3432,21,75\n' +
      'Mercury Zephyr 6,19.8,6,200,85,2990,18.2,79\n' +
      'Mercury Zephyr,20.8,6,200,85,3070,16.7,78\n' +
      'Nissan Stanza XE,36,4,120,88,2160,14.5,82\n' +
      'Oldsmobile Cutlass Ciera (Diesel),38,6,262,85,3015,17,82\n' +
      'Oldsmobile Cutlass LS,26.6,8,350,105,3725,19,81\n' +
      'Oldsmobile Cutlass Salon Brougham,19.9,8,260,110,3365,15.5,78\n' +
      'Oldsmobile Cutlass Salon Brougham,23.9,8,260,90,3420,22.2,79\n' +
      'Oldsmobile Cutlass Supreme,17,8,260,110,4060,19,77\n' +
      'Oldsmobile Delta 88 Royale,12,8,350,160,4456,13.5,72\n' +
      'Oldsmobile Omega Brougham,26.8,6,173,115,2700,12.9,79\n' +
      'Oldsmobile Omega,11,8,350,180,3664,11,73\n' +
      'Oldsmobile Starfire SX,23.8,4,151,85,2855,17.6,78\n' +
      'Oldsmobile Vista Cruiser,12,8,350,180,4499,12.5,73\n' +
      'Opel 1900,25,4,116,81,2220,16.9,76\n' +
      'Opel 1900,28,4,116,90,2123,14,71\n' +
      'Opel Manta,24,4,116,75,2158,15.5,73\n' +
      'Opel Manta,26,4,97,78,2300,14.5,74\n' +
      'Peugeot 304,30,4,79,70,2074,19.5,71\n' +
      'Peugeot 504 (Wagon),21,4,120,87,2979,19.5,72\n' +
      'Peugeot 504,19,4,120,88,3270,21.9,76\n' +
      'Peugeot 504,23,4,120,88,2957,17,75\n' +
      'Peugeot 504,25,4,110,87,2672,17.5,70\n' +
      'Peugeot 504,27.2,4,141,71,3190,24.8,79\n' +
      'Peugeot 505S Turbo Diesel,28.1,4,141,80,3230,20.4,81\n' +
      'Peugeot 604SL,16.2,6,163,133,3410,15.8,78\n' +
      'Plymouth Arrow GS,25.5,4,122,96,2300,15.5,77\n' +
      'Plymouth Barracuda 340,14,8,340,160,3609,8,70\n' +
      'Plymouth Champ,39,4,86,64,1875,16.4,81\n' +
      'Plymouth Cricket,26,4,91,70,1955,20.5,71\n' +
      'Plymouth Custom Suburb,13,8,360,170,4654,13,73\n' +
      'Plymouth Duster,20,6,198,95,3102,16.5,74\n' +
      'Plymouth Duster,22,6,198,95,2833,15.5,70\n' +
      'Plymouth Duster,23,6,198,95,2904,16,73\n' +
      'Plymouth Fury Gran Sedan,14,8,318,150,4237,14.5,73\n' +
      'Plymouth Fury III,14,8,318,150,4096,13,71\n' +
      'Plymouth Fury III,14,8,440,215,4312,8.5,70\n' +
      'Plymouth Fury III,15,8,318,150,4135,13.5,72\n' +
      'Plymouth Fury,18,6,225,95,3785,19,75\n' +
      'Plymouth Grand Fury,16,8,318,150,4498,14.5,75\n' +
      'Plymouth Horizon 4,34.7,4,105,63,2215,14.9,81\n' +
      'Plymouth Horizon Miser,38,4,105,63,2125,14.7,82\n' +
      'Plymouth Horizon TC3,34.5,4,105,70,2150,14.9,79\n' +
      'Plymouth Horizon,34.2,4,105,70,2200,13.2,79\n' +
      'Plymouth Reliant,27.2,4,135,84,2490,15.7,81\n' +
      'Plymouth Reliant,30,4,135,84,2385,12.9,81\n' +
      'Plymouth Sapporo,23.2,4,156,105,2745,16.7,78\n' +
      'Plymouth Satellite (Wagon),,8,383,175,4166,10.5,70\n' +
      'Plymouth Satellite Custom (Wagon),14,8,318,150,4077,14,72\n' +
      'Plymouth Satellite Custom,16,6,225,105,3439,15.5,71\n' +
      'Plymouth Satellite Sebring,18,6,225,105,3613,16.5,74\n' +
      'Plymouth Satellite,18,8,318,150,3436,11,70\n' +
      'Plymouth Valiant Custom,19,6,225,95,3264,16,75\n' +
      'Plymouth Valiant,18,6,225,105,3121,16.5,73\n' +
      'Plymouth Valiant,22,6,225,100,3233,15.4,76\n' +
      'Plymouth Volare Custom,19,6,225,100,3630,17.7,77\n' +
      'Plymouth Volare Premier V8,13,8,318,150,3940,13.2,76\n' +
      'Plymouth Volare,20.5,6,225,100,3430,17.2,78\n' +
      'Pontiac Astro,23,4,140,78,2592,18.5,75\n' +
      'Pontiac Catalina Brougham,14,8,400,175,4464,11.5,71\n' +
      'Pontiac Catalina,14,8,400,175,4385,12,72\n' +
      'Pontiac Catalina,14,8,455,225,4425,10,70\n' +
      'Pontiac Catalina,16,8,400,170,4668,11.5,75\n' +
      'Pontiac Firebird,19,6,250,100,3282,15,71\n' +
      'Pontiac Grand Prix Lj,16,8,400,180,4220,11.1,77\n' +
      'Pontiac Grand Prix,16,8,400,230,4278,9.5,73\n' +
      'Pontiac J2000 Se Hatchback,31,4,112,85,2575,16.2,82\n' +
      'Pontiac Lemans V6,21.5,6,231,115,3245,15.4,79\n' +
      'Pontiac Phoenix LJ,19.2,6,231,105,3535,19.2,78\n' +
      'Pontiac Phoenix,27,4,151,90,2735,18,82\n' +
      'Pontiac Phoenix,33.5,4,151,90,2556,13.2,79\n' +
      'Pontiac Safari (Wagon),13,8,400,175,5140,12,71\n' +
      'Pontiac Sunbird Coupe,24.5,4,151,88,2740,16,77\n' +
      'Pontiac Ventura Sj,18.5,6,250,110,3645,16.2,76\n' +
      'Renault 12 (Wagon),26,4,96,69,2189,18,72\n' +
      'Renault 12TL,27,4,101,83,2202,15.3,76\n' +
      'Renault 18I,34.5,4,100,,2320,15.8,81\n' +
      'Renault 5 Gtl,36,4,79,58,1825,18.6,77\n' +
      'Renault Lecar Deluxe,40.9,4,85,,1835,17.3,80\n' +
      'Saab 900S,,4,121,110,2800,15.4,81\n' +
      'Saab 99E,25,4,104,95,2375,17.5,70\n' +
      'Saab 99GLE,21.6,4,121,115,2795,15.7,78\n' +
      'Saab 99LE,24,4,121,110,2660,14,73\n' +
      'Saab 99LE,25,4,121,115,2671,13.5,75\n' +
      'Subaru DL,30,4,97,67,1985,16.4,77\n' +
      'Subaru DL,33.8,4,97,67,2145,18,80\n' +
      'Subaru,26,4,108,93,2391,15.5,74\n' +
      'Subaru,32.3,4,97,67,2065,17.8,81\n' +
      'Toyota Carina,20,4,97,88,2279,19,73\n' +
      'Toyota Celica GT Liftback,21.1,4,134,95,2515,14.8,78\n' +
      'Toyota Celica GT,32,4,144,96,2665,13.9,82\n' +
      'Toyota Corolla 1200,31,4,71,65,1773,19,71\n' +
      'Toyota Corolla 1200,32,4,71,65,1836,21,74\n' +
      'Toyota Corolla 1600 (Wagon),27,4,97,88,2100,16.5,72\n' +
      'Toyota Corolla Liftback,26,4,97,75,2265,18.2,77\n' +
      'Toyota Corolla Tercel,38.1,4,89,60,1968,18.8,80\n' +
      'Toyota Corolla,28,4,97,75,2155,16.4,76\n' +
      'Toyota Corolla,29,4,97,75,2171,16,75\n' +
      'Toyota Corolla,32.2,4,108,75,2265,15.2,80\n' +
      'Toyota Corolla,32.4,4,108,75,2350,16.8,81\n' +
      'Toyota Corolla,34,4,108,70,2245,16.9,82\n' +
      'Toyota Corona Hardtop,24,4,113,95,2278,15.5,72\n' +
      'Toyota Corona Liftback,29.8,4,134,90,2711,15.5,80\n' +
      'Toyota Corona Mark II,24,4,113,95,2372,15,70\n' +
      'Toyota Corona,24,4,134,96,2702,13.5,75\n' +
      'Toyota Corona,25,4,113,95,2228,14,71\n' +
      'Toyota Corona,27.5,4,134,95,2560,14.2,78\n' +
      'Toyota Corona,31,4,76,52,1649,16.5,74\n' +
      'Toyota Cressida,25.4,6,168,116,2900,12.6,81\n' +
      'Toyota Mark II,19,6,156,108,2930,15.5,76\n' +
      'Toyota Mark II,20,6,156,122,2807,13.5,73\n' +
      'Toyota Starlet,39.1,4,79,58,1755,16.9,81\n' +
      'Toyota Tercel,37.7,4,89,62,2050,17.3,81\n' +
      'Toyouta Corona Mark II (Wagon),23,4,120,97,2506,14.5,72\n' +
      'Triumph TR7 Coupe,35,4,122,88,2500,15.1,80\n' +
      'Vokswagen Rabbit,29.8,4,89,62,1845,15.3,80\n' +
      'Volkswagen 1131 Deluxe Sedan,26,4,97,46,1835,20.5,70\n' +
      'Volkswagen 411 (Wagon),22,4,121,76,2511,18,72\n' +
      'Volkswagen Dasher (Diesel),43.4,4,90,48,2335,23.7,80\n' +
      'Volkswagen Dasher,25,4,90,71,2223,16.5,75\n' +
      'Volkswagen Dasher,26,4,79,67,1963,15.5,74\n' +
      'Volkswagen Dasher,30.5,4,97,78,2190,14.1,77\n' +
      'Volkswagen Jetta,33,4,105,74,2190,14.2,81\n' +
      'Volkswagen Model 111,27,4,97,60,1834,19,71\n' +
      'Volkswagen Pickup,44,4,97,52,2130,24.6,82\n' +
      'Volkswagen Rabbit C (Diesel),44.3,4,90,48,2085,21.7,80\n' +
      'Volkswagen Rabbit Custom Diesel,43.1,4,90,48,1985,21.5,78\n' +
      'Volkswagen Rabbit Custom,29,4,97,78,1940,14.5,77\n' +
      'Volkswagen Rabbit Custom,31.9,4,89,71,1925,14,79\n' +
      'Volkswagen Rabbit L,36,4,105,74,1980,15.3,82\n' +
      'Volkswagen Rabbit,29,4,90,70,1937,14,75\n' +
      'Volkswagen Rabbit,29,4,90,70,1937,14.2,76\n' +
      'Volkswagen Rabbit,29.5,4,97,71,1825,12.2,76\n' +
      'Volkswagen Rabbit,41.5,4,98,76,2144,14.7,80\n' +
      'Volkswagen Scirocco,31.5,4,89,71,1990,14.9,78\n' +
      'Volkswagen Super Beetle 117,,4,97,48,1978,20,71\n' +
      'Volkswagen Super Beetle,26,4,97,46,1950,21,73\n' +
      'Volkswagen Type 3,23,4,97,54,2254,23.5,72\n' +
      'Volvo 144EA,19,4,121,112,2868,15.5,73\n' +
      'Volvo 145E (Wagon),18,4,121,112,2933,14.5,72\n' +
      'Volvo 244DL,22,4,121,98,2945,14.5,75\n' +
      'Volvo 245,20,4,130,102,3150,15.7,76\n' +
      'Volvo 264GL,17,6,163,125,3140,13.6,78\n' +
      'Volvo Diesel,30.7,6,145,76,3160,19.6,81';
  }

  rotateForward(): void {
    this.degree += this.degreeDelta;
    if (this.degree > 360) {
      this.degree = 0;
    }

    this.doRotation();
  }

  rotateBackward(): void {
    this.degree -= this.degreeDelta;
    if (this.degree < 0) {
      this.degree = 360;
    }

    this.doRotation();
  }

  resetRotation(): void {
    this.degree = 0;
    this.doRotation();
  }

  private doRotation(): void {
    const line = d3.line();
    const xScaler = this.xScaler;
    const yScalers = this.yScalers;

    const toCoord = (v: number, c: number) => [xScaler(c), yScalers.get(c)(v)];
    const rowToCoord = (row: number[]) => row.map((v, c) => toCoord(v, c));
    const rowToLine = (row: number[]) => {
      const d = rowToCoord(row) as [number, number][];
      return line(d);
    };

    const data = this.grandTour.rotate(this.degree);
    this.data.data = data;

    d3.selectAll('.line-path')
      .data(this.data.data)
      .attr('d', (row) => rowToLine(row));
  }
}
