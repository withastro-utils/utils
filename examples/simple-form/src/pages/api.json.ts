export async function GET({params, request, ...all}) {
    console.log(all);
    return new Response(
        JSON.stringify({
            name: 'Astro',
            url: 'https://astro.build/'
        })
    );
}
