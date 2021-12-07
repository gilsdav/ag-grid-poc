import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class PostService {

    private readonly baseUrl = 'http://localhost:3000';

    constructor(private http: HttpClient) {
    }

    public getPosts(
        page: {from: number, to: number},
        sort?: { field: string , order: 'asc'|'desc' },
        filters?: { [field: string]: { filterType: 'set'|'text'|'number', values: string[], filter: string, type: 'contains'|'equals'|'lessThan'|'greaterThan' } }
    ) {

        const generatedFilters = {};

        if (filters) {
            Object.keys(filters).forEach(filterField => {
                const filter = filters[filterField];
                if (filter.filterType === 'set') {
                    generatedFilters[filterField] = filter.values;
                } else if (filter.filterType === 'text' && filter.type === 'contains') {
                    generatedFilters[`${filterField}_like`] = filter.filter;
                    // if (!generatedFilters['q']) {
                    //     generatedFilters['q'] = [];
                    // }
                    // generatedFilters['q'].push(filter.filterType="");
                } else if (filter.filterType === 'number') {
                    switch (filter.type) {
                        case 'equals':
                            generatedFilters[`${filterField}`] = filter.filter;
                            break;
                        case 'lessThan':
                            generatedFilters[`${filterField}_lte`] = filter.filter;
                            break;
                        case 'greaterThan':
                            generatedFilters[`${filterField}_gte`] = filter.filter;
                            break;
                    }
                }
            });
        }

        return this.http.get<any[]>(`${this.baseUrl}/posts`, { params: {
            _start: `${page.from}`,
            _end: `${page.to}`,
            ...(
                sort ? {
                    _sort: sort.field,
                    _order: sort.order
                } : {}
            ),
            ...generatedFilters
        }, observe: 'response' }).pipe(
            map(response => ({
                posts: response.body,
                totalCount: +response.headers.get('X-Total-Count')
            }))
        );
    }

}
