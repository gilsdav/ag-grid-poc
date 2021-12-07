import { Component, OnInit, ViewChild } from '@angular/core';

import { IServerSideDatasource, Module } from '@ag-grid-community/core';
import { AgGridAngular } from '@ag-grid-community/angular';

import { ServerSideRowModelModule } from '@ag-grid-enterprise/server-side-row-model';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { ColumnsToolPanelModule } from '@ag-grid-enterprise/column-tool-panel';
// import { MenuModule } from '@ag-grid-enterprise/menu';

import { ProfileService } from './profile.service';
import { PostService } from './post.service';

// import { ColDef } from 'ag-grid-enterprise';

interface RowData {
    title: string;
    author: string;
    price: number;
    status: 'TODO' | 'IN-PROGRESS' | 'DONE';
}

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    title = 'audi-poc';
    profileName = '';
    currentProfile;
    profils: any[];
    modules: Module[] = [
        ServerSideRowModelModule,
        SetFilterModule,
        ColumnsToolPanelModule
    ];
    pagination = true;
    paginationPageSize = 10;
    cacheBlockSize = 10;

    @ViewChild(AgGridAngular) agGridAngular: AgGridAngular;

    rowModelType = 'serverSide';
    serverSideDatasource: IServerSideDatasource;

    public get agGridApi() {
        return this.agGridAngular.api;
    }
    public get agGridColumnApi() {
        return this.agGridAngular.columnApi;
    }

    columnDefs: ( {
            field: keyof RowData,
            sortable: boolean,
            filter: boolean|'agNumberColumnFilter'|'agTextColumnFilter'|'agSetColumnFilter',
            type?: 'text' | 'number',
            filterParams?: { values: string[] | ((params: any) => void) },
            resizable?: boolean
    })[] = [
        { field: 'title', sortable: true, filter: 'agTextColumnFilter', resizable: true },
        { field: 'author', sortable: true, filter: 'agTextColumnFilter', resizable: true },
        { field: 'price', sortable: true, filter: 'agNumberColumnFilter', resizable: true, type: 'number' },
        { field: 'status', sortable: true, filter: 'agSetColumnFilter', resizable: true, filterParams: { values: function(params) { params.success(['TODO', 'IN-PROGRESS', 'DONE']) } } }
    ];


    rowData: RowData[] = [
        // { title: 'Toyota', author: 'Celica', price: 35000 },
        // { title: 'Ford', author: 'Mondeo', price: 32000 },
        // { title: 'Porsche', author: 'Boxter', price: 72000 },
    ];

    sideBar = {
        toolPanels: [
            {
              id: 'columns',
              labelDefault: 'Columns',
              labelKey: 'columns',
              iconKey: 'columns',
              toolPanel: 'agColumnsToolPanel',
              toolPanelParams: {
                suppressRowGroups: true,
                suppressValues: true,
                suppressPivots: true,
                suppressPivotMode: true,
                suppressColumnFilter: true,
                suppressColumnSelectAll: true,
                suppressColumnExpandAll: true,
              },
            },
          ],
          defaultToolPanel: ''
    };

    constructor(
        private profileService: ProfileService,
        private postService: PostService
    ) {}

    ngOnInit(): void {
        this.fetchProfiles(() => {
            this.profileService.getFavorit().subscribe(profileId => {
                if (profileId) {
                    const profile = this.profils.find(p => p.id === profileId);
                    if (profile) {
                        this.loadProfile(profile);
                    }
                }
            })
        });
        this.serverSideDatasource = {
            getRows: (params) => {
                console.log(params);
                const request = params.request;
                const sort = request.sortModel;
                const filter = request.filterModel;
                const pageFrom = request.startRow;
                const pageTo = request.endRow;
                this.postService.getPosts(
                    { from: pageFrom, to: pageTo },
                    sort.length > 0 ? { field: sort[0].colId, order: sort[0].sort } : undefined,
                    filter
                ).subscribe(response => {
                    console.log(response);
                    params.successCallback(response.posts, response.totalCount);
                });
            }
        };
    }

    public fetchProfiles(callback?: () => void): void {
        this.profileService.getProfiles().subscribe(profiles => {
            this.profils = profiles;
            if (callback) {
                callback();
            }
        });
    }

    public saveProfile(): void {
        const state = {
            column: this.agGridColumnApi.getColumnState(),
            filters: this.agGridApi.getFilterModel(),
            sorting: this.agGridApi.getSortModel(),
            name: this.profileName,
            id: this.currentProfile ? this.currentProfile.id : undefined
        };
        console.log(state);
        this.profileService.createOrUpdateProfile(state).subscribe(response => {
            console.log(response);
            this.fetchProfiles();
        });
    }

    public loadProfile(profile): void {
        this.currentProfile = profile;
        this.agGridColumnApi.setColumnState(profile.column);
        this.agGridApi.setFilterModel(profile.filters);
        this.agGridApi.setSortModel(profile.sorting);
        this.profileName = profile.name;
    }

    public profileSelected(profile): void {
        console.log(profile);
        this.loadProfile(profile);
        this.saveFavorit(profile);
    }

    public newProfile(): void {
        this.currentProfile = null;
        this.agGridColumnApi.resetColumnState();
        this.agGridApi.setFilterModel({});
        this.agGridApi.setSortModel({});
        this.profileName = '';
        this.saveFavorit({ id: null });
    }

    public saveFavorit(profile?) {
        this.profileService.saveFavorit(profile.id).subscribe();
    }

    public comparator = (o1: any, o2: any) => !o1 && !o2 || (o1 && o1.id) === (o2 && o2.id);

}
