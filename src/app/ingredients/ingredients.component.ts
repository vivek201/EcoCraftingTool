import {Component, EventEmitter, Inject, Input, OnInit, Output} from '@angular/core';
import {CraftingDataService} from '../service/crafting-data.service';
import {Item} from '../interface/item';
import {Locale, LocaleService} from '../service/locale.service';
import {MessageService} from '../service/message.service';
import {CookieService} from 'ngx-cookie-service';
import {IngredientCookie} from '../cookie/ingredient-cookie';
import {LOCAL_STORAGE, StorageService} from 'ngx-webstorage-service';

export const ITEM_SPRITE_SIZE = 32;

@Component({
  selector: 'app-ingredients',
  templateUrl: './ingredients.component.html',
  styleUrls: ['./ingredients.component.css']
})
export class IngredientsComponent implements OnInit {

  itemIngredients: Item[];
  laborCost: number;
  profitPercent: number;
  locale: Locale;

  @Input() imageBaseUrl: string;
  @Input() imageTemplateUrl: string;

  @Output() ingredientPriceChangedEvent = new EventEmitter<Item>();
  @Output() laborCostChangedEvent = new EventEmitter<number>();
  @Output() profitPercentChangedEvent = new EventEmitter<number>();

  constructor(private dataService: CraftingDataService, private localeService: LocaleService,
              private messageService: MessageService, private cookieService: CookieService,
              @Inject(LOCAL_STORAGE) private storageService: StorageService) {
    this.itemIngredients = [];
    this.laborCost = 0;
    this.profitPercent = 0;
    this.locale = localeService.selectedLocale;
  }

  ngOnInit(): void {

    let ingredients = this.storageService.get('ingredients');
    if (ingredients != null) {
      ingredients.forEach(ing => {
        let item = this.dataService.getItems().find(item => item.nameID.localeCompare(ing.id) === 0);
        item.price = ing.pr;
        this.itemIngredients.push(item);
      });
    } else if (this.cookieService.check('ingredients')) {
      let ingredientCookies: IngredientCookie[] = JSON.parse(atob(this.cookieService.get('ingredients')));
      ingredientCookies.forEach(cookie => {
        let item = this.dataService.getItems().find(item => item.nameID.localeCompare(cookie.id) === 0);
        item.price = cookie.pr;
        this.itemIngredients.push(item);
      });
      this.cookieService.delete('ingredients');
      this.storageService.set('ingredients', ingredientCookies);
    }

    let laborCost = this.storageService.get('laborCost');
    if (laborCost != null) {
      this.laborCost = Number.parseFloat(laborCost);
    } else if (this.cookieService.check('laborCost')) {
      this.laborCost = Number.parseFloat(this.cookieService.get('laborCost'));
      this.cookieService.delete('laborCost');
      this.storageService.set('laborCost', this.laborCost.toLocaleString(this.localeService.selectedLocale.code,
        {minimumFractionDigits: 0, maximumFractionDigits: 2}));
    }

    let profit = this.storageService.get('profitPercent');
    if (profit != null) {
      this.profitPercent = Number.parseFloat(profit);
    } else if (this.cookieService.check('profitPercent')) {
      this.profitPercent = Number.parseFloat(this.cookieService.get('profitPercent'));
      this.cookieService.delete('profitPercent');
      this.storageService.set('profitPercent', this.profitPercent.toLocaleString(this.localeService.selectedLocale.code,
        {minimumFractionDigits: 0, maximumFractionDigits: 2}));
    }
  }

  message(id: string): string {
    return this.messageService.getMessage(id, this.locale);
  }

  onPriceChange(item: Item, value: string) {
    let price = this.toFloat(value);
    if (price !== item.price && !isNaN(price)) {
      const index = this.itemIngredients.findIndex(i => i.nameID === item.nameID);
      item.price = price;
      this.itemIngredients[index] = item;
      this.ingredientPriceChangedEvent.emit(item);
    }
  }

  onLaborCostChange(value: string): void {
    let newValue = this.toFloat(value);

    if (!isNaN(newValue)) {
      this.laborCost = newValue;
      this.laborCostChangedEvent.emit(this.laborCost);
    }
  }

  onProfitPercentChange(value: string): void {
    let newValue = this.toFloat(value);

    if (!isNaN(newValue)) {
      this.profitPercent = newValue;
      this.profitPercentChangedEvent.emit(this.profitPercent);
    }
  }

  ingredientExists(nameID: string): boolean {
    return this.itemIngredients.some(ing => ing.nameID.localeCompare(nameID) === 0);
  }

  sortIngredients() {
    this.itemIngredients.sort((a, b) => a.name.localeCompare(b.name, this.locale.code));
  }

  getItemImageUrl(item: Item): string {
    if (item.nameID.localeCompare('LightBulbItem') === 0) {
      return this.imageBaseUrl + 'lightbulb.png';
    } else {
      return this.imageBaseUrl + item.imageFile;
    }
  }

  getItemSpritePosition(item: Item): string {
    if (item.nameID.localeCompare('LightBulbItem') === 0) {
      return '0px 0px'
    }
    return `-${item.xPos * ITEM_SPRITE_SIZE}px -${item.yPos * ITEM_SPRITE_SIZE}px`;
  }

  getItemBackgroundSize(item: Item): string {
    if (item.nameID.localeCompare('LightBulbItem') === 0) {
      return '32px'
    } else if ('UI_Icons_Baked_0.png'.localeCompare(item.imageFile) === 0) {
      return '2048px';
    }
    return '512px';
  }

  getItemFilter(item: Item): string {
    if (item.filter != undefined) {
      return item.filter;
    }
    return '';
  }

  localize(locale: Locale) {
    this.locale = locale;
    this.itemIngredients.forEach(item => item.name = this.localeService.localizeItemName(item.nameID, locale.langCode()));
    this.sortIngredients();
  }

  toFloat(input: string) {
    const delimiterRegex = /[0-9,.]*([,.])[0-9]*/;
    const delim = input.match(delimiterRegex);
    if (delim) {
      if (delim[1] == ',') {
        input = input.replace('.', '').replace(',', '.');
      } else if (delim[1] == '.') {
        input = input.replace(',', '');
      }
    }
    return parseFloat(input);
  }
}
