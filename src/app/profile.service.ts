import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class ProfileService {

    private readonly baseUrl = 'http://localhost:3000';

    constructor(private http: HttpClient) {
    }

    public getProfiles() {
        return this.http.get<any[]>(`${this.baseUrl}/profiles`);
    }

    public createOrUpdateProfile(profile) {
        if (profile.id) {
            return this.http.put(`${this.baseUrl}/profiles/${profile.id}`, profile);
        } else {
            return this.http.post(`${this.baseUrl}/profiles`, profile);
        }
    }

    public saveFavorit(profileId) {
        return this.http.put(`${this.baseUrl}/favorit`, { profile: profileId });
    }

    public getFavorit() {
        return this.http.get<{ profile: number }>(`${this.baseUrl}/favorit`).pipe(
            map(f => f.profile)
        );
    }

}
