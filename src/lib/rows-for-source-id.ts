const API_PREFIX = 'https://app.dev.outerbase.com/api/v1'

export default function dbRowsForSource(sourceId: string, authToken: string) {
    // TODO this is currently copy/pasted from a Dashboard call
    return fetch(`${API_PREFIX}/workspace/-est/source/e77094c5-4e4b-4263-a614-8e05b98f5db0/table/db/Movies/rows`, {
        body: '{"fields":[{"alias":"id","field":"id"},{"alias":"title","field":"title"},{"alias":"genres","field":"genres"},{"alias":"original_language","field":"original_language"},{"alias":"overview","field":"overview"},{"alias":"popularity","field":"popularity"},{"alias":"production_companies","field":"production_companies"},{"alias":"release_date","field":"release_date"},{"alias":"budget","field":"budget"},{"alias":"revenue","field":"revenue"},{"alias":"runtime","field":"runtime"},{"alias":"status","field":"status"},{"alias":"tagline","field":"tagline"},{"alias":"vote_average","field":"vote_average"},{"alias":"vote_count","field":"vote_count"},{"alias":"credits","field":"credits"},{"alias":"keywords","field":"keywords"},{"alias":"poster_path","field":"poster_path"},{"alias":"backdrop_path","field":"backdrop_path"},{"alias":"recommendations","field":"recommendations"}],"filters":[],"include_count":true,"limit":50,"offset":0,"order":[]}',
        headers: {
            'Content-Type': 'application/json',
            'x-auth-token': authToken,
        },
        method: 'POST',
        mode: 'cors',
    })
        .then((response) => response.json())
        .then((data) => data.response)
}
