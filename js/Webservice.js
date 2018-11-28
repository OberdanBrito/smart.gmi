class Webservice {

    static Ws() {
        return '../../ws/?p=0&c=7&cn=as&';
    }

    static SetParameters(parametros) {
        let result = '';
        for (let key in parametros)
            if (parametros.hasOwnProperty(key))
                result += key + '=' + parametros[key] + '&';

        return Webservice.Ws() + result.substring(0, result.length - 1);
    };

    Request(data, callback) {

        this.process = data.process;

        let xhr = new XMLHttpRequest();
        xhr.open('POST', Webservice.Ws(), true);
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                callback(xhr);
            } else if (xhr.status !== 200 && xhr.status !== 304) {
                callback(false);
            }
        };
        xhr.send(Webservice.SetParameters(data));
    };

    PreparaLista(processo, resultado) {

        let lista = [];
        JSON.parse(resultado, function (chave, valor) {
            if (chave === processo)
                lista.push(JSON.parse(valor));
        });
        return lista;

    };

    PreparaGrid(processo, resultado) {

        let lista = [];
        JSON.parse(resultado, function (chave, valor) {
            if (chave === processo) {
                let dados = JSON.parse(valor);
                let values = [];
                for(let key in dados)
                    values.push(dados[key]);
                lista.push({id: dados.id, data: values});
            }
        });

        return {rows: lista};

    };
}