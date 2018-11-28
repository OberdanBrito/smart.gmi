let Cadastro = function () {

    let that = this, form, grid, estruturacorrente, cellestrutura, cellform, cellgrid;

    this.MontaLayout = function (container) {

        let layout = container.attachLayout({
            pattern: '3L',
            offsets: {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            },
            cells: [
                {
                    id: 'a',
                    header: false,
                    width: 180,
                    fix_size: [true, null]
                },
                {
                    id: 'b',
                    header: false,
                    height: 380
                },
                {
                    id: 'c',
                    header: false,
                }
            ]
        });

        cellestrutura = layout.cells('a');
        cellform = layout.cells('b');
        cellgrid = layout.cells('c');

        MontaListaEstrutura(cellestrutura);
        MontaBarraComandos(cellform);
        MontaFormulario(cellform);
        MontaGrid(cellgrid);

    };

    this.Info = function (id, Callback) {

        webservice.Request({
            process: 'query',
            params: JSON.stringify({
                command: 'select',
                fields: '*',
                from: 'gmi.estoque_tipo',
                where: 'id='+id
            })
        }, function (http) {

            if (http.response === 'null' || http.response === 'false') {
                Callback(null);
                return;
            }

            Callback(webservice.PreparaLista('query',http.response));
        });

    };

    this.Listar = function (id, Callback) {

        webservice.Request({
            process: 'query',
            params: JSON.stringify({
                command: 'select',
                fields: 'entrada,id,descricao',
                from: 'gmi.lista_cadastro',
                where: 'estrutura='+id,
                order: 'id'
            })
        }, function (http) {

            if (http.response === 'null' || http.response === 'false') {
                Callback(null);
                return;
            }

            Callback(webservice.PreparaGrid('query',http.response));
        });

    };

    function MontaBarraComandos(cell) {

        cell.detachToolbar();

        cell.attachToolbar({
            icon_path: "./img/toolbar/cadastro/",
            items:[
                {id: "novo", text:"Novo", type: "button", img: "novo.png"},
                {id: "salvar", text:"Salvar", type: "button", img: "salvar.png"},
                {id: "remover", text:"Remover", type: "button", img: "remover.png"},
            ],
            onClick: function (id) {
                switch (id) {
                    case 'novo':
                        that.LimparFormulario();
                        break;
                    case 'salvar':
                        form.validate();
                        break;
                    case 'remover':
                        that.RemoverItem(form.getItemValue('id'), AoExecutarOperacao);
                        break;
                }
            }
        });

    }

    this.LimparFormulario = function() {

        form.clear();
        form.setFormData({});
        form.setItemValue('id', null);

    };

    this.AdicionarItem = function (dados, Callback) {

        webservice.Request({
            process: 'query',
            params: JSON.stringify({
                command: 'insert',
                fields: dados,
                from: 'gmi.estoque_tipo',
                returning: 'id'
            })
        }, function (http) {

            if (http.response === 'null' || http.response === 'false') {
                Callback(null);
                return;
            }

            Callback(webservice.PreparaLista('query',http.response));
        });

    };

    this.EditarItem = function (dados, Callback) {

        console.debug({
            process: 'query',
            params: JSON.stringify({
                command: 'update',
                fields:dados,
                from: 'gmi.estoque_tipo',
                where: 'id='+dados.id,
                returning: 'estrutura as id'
            })
        });

        webservice.Request({
            process: 'query',
            params: JSON.stringify({
                command: 'update',
                fields:dados,
                from: 'gmi.estoque_tipo',
                where: 'id='+dados.id,
                returning: 'estrutura as id'
            })
        }, function (http) {

            if (http.response === 'null' || http.response === 'false') {
                Callback(null);
                return;
            }

            Callback(webservice.PreparaLista('query',http.response));
        });

    };


    this.RemoverItem = function(id, Callback) {

        dhtmlx.confirm({
            type:"confirm-warning",
            title:"Atenção",
            text:"Você confirma a exclusão deste registro?",
            ok:"Sim", cancel:"Não",
            callback:function(result){

                if (result !== true)
                    return;

                webservice.Request({
                    process: 'query',
                    params: JSON.stringify({
                        command: 'delete',
                        from: 'gmi.estoque_tipo',
                        where: 'id='+id,
                        returning: 'id'
                    })
                }, function (http) {

                    if (http.response === 'null' || http.response === 'false') {
                        Callback(null);
                        return;
                    }

                    Callback(webservice.PreparaLista('query',http.response));
                });
            }
        });
    };

    function MontaListaEstrutura(cell) {

        let list = cell.attachList({
            container: "data_container",
            type: {
                template: "http->./html/estoqueestrutura.html",
                height: 55
            }
        });

        let estrutura = new Estrutura();
        cell.progressOn();
        estrutura.Listar(function (response) {

            cell.progressOff();
            if (response === null)
                return;

            list.parse(response, 'json');
        });

        list.attachEvent("onItemClick", function (id) {
            cell.progressOn();
            that.Listar(id, function (response) {

                estruturacorrente = id;
                grid.clearAll();
                that.LimparFormulario();
                cell.progressOff();
                if (response === null)
                    return;

                grid.parse(response,"json");
            });
            return true;
        });


    }

    function MontaFormulario(cell) {

        cell.progressOn();
        cell.detachObject(true);
        form = cell.attachForm();
        form.loadStruct(formcadastro, function () {
           let combo = form.getCombo('estrutura');
           new Estrutura().Listar(function (estruturas) {

               cell.progressOff();
               if (estruturas === null)
                   return;

               estruturas.filter(function (item) {
                   combo.addOption(item.id, item.nome);
               })


           })
        });
        form.setItemValue('foto', 'default.png');


        form.attachEvent("onAfterValidate", function (status){

            if (status === false)
                return;

            cellform.progressOn();
            let dados = form.getFormData();

            if (dados.estrutura === undefined || dados.estrutura.length === 0)
            {
                cellform.progressOff();
                dhtmlx.alert({
                    title:"GMI",
                    type:"alert-error",
                    text:"Selecione a estrutura pertencente ao item"
                });
                return;
            }

            dados.responsavel = usuariocorrente.login;
            dados.media_valor = converteMoedaFloat(dados.media_valor);

            if (dados.id > 0) {
                that.EditarItem(dados, AoExecutarOperacao);
            } else {
                that.AdicionarItem(dados, AoExecutarOperacao);
            }

        });

        form.attachEvent("onImageUploadSuccess", function(name, value, extra){
            console.info(name, value, extra);
        });

        form.attachEvent("onImageUploadFail", function(name, extra){
            console.error("onImageUploadFail", name, extra);
            dhtmlx.alert({
                title:"GMI",
                type:"alert-error",
                text:"Não foi possível salvar a imagem.\r\nVerifique as permissões de armazenamento deste serviço"
            });

        });

    }

    function AoExecutarOperacao(response) {

        cellform.progressOff();
        cellgrid.progressOn();
        that.LimparFormulario();

        that.Listar(estruturacorrente, function (registros) {

            cellgrid.progressOff();
            if (registros === null)
                return;

            grid.clearAll();
            grid.parse(registros,"json");
        });
    }

    function MontaGrid(cell) {

        grid = cell.attachGrid();
        grid.setHeader(['Entrada', 'Código', 'Descrição']);
        grid.attachHeader('#text_filter,#text_filter,#text_filter');
        grid.setColTypes('ro,ro,ro');
        grid.setColSorting('date,str,str');
        grid.enableSmartRendering(true);
        grid.enableMultiselect(true);
        grid.init();

        grid.attachEvent("onRowSelect", function (id) {
            cellform.progressOn();
            that.Info(id, function (response) {

                cellform.progressOff();

                if (response === null)
                    return;

                let dados = response[0];
                dados.media_valor = converteFloatMoeda(dados.media_valor);
                form.setFormData(dados);
            })
        });

    }
};

/*@file utils.js
@brief Conjunto de funções para tratamento dos dados
@author Marcone Gledson de Almeida
@date 2008
*/

/*   @brief Converte uma string em formato moeda para float
@param valor(string) - o valor em moeda
@return valor(float) - o valor em float
*/
function converteMoedaFloat(valor){

    if(valor === ""){
        valor =  0;
    }else{
        valor = valor.replace(".","");
        valor = valor.replace(",",".");
        valor = parseFloat(valor);
    }
    return valor;

}

/*   @brief Converte um valor em formato float para uma string em formato moeda
   @param valor(float) - o valor float
   @return valor(string) - o valor em moeda
*/
function converteFloatMoeda(valor){
    var inteiro = null, decimal = null, c = null, j = null;
    var aux = new Array();
    valor = ""+valor;
    c = valor.indexOf(".",0);
    //encontrou o ponto na string
    if(c > 0){
        //separa as partes em inteiro e decimal
        inteiro = valor.substring(0,c);
        decimal = valor.substring(c+1,valor.length);
    }else{
        inteiro = valor;
    }

    //pega a parte inteiro de 3 em 3 partes
    for (j = inteiro.length, c = 0; j > 0; j-=3, c++){
        aux[c]=inteiro.substring(j-3,j);
    }

    //percorre a string acrescentando os pontos
    inteiro = "";
    for(c = aux.length-1; c >= 0; c--){
        inteiro += aux[c]+'.';
    }
    //retirando o ultimo ponto e finalizando a parte inteiro

    inteiro = inteiro.substring(0,inteiro.length-1);

    decimal = parseInt(decimal);
    if(isNaN(decimal)){
        decimal = "00";
    }else{
        decimal = ""+decimal;
        if(decimal.length === 1){
            decimal = decimal+"0";
        }
    }


    valor = inteiro+","+decimal;


    return valor;

}

let formcadastro = [
    {type: 'settings', offsetTop:15, inputWidth:200, labelWidth:140, labelAlign: 'right'},
    {type: 'template', name: 'id', label: 'Código:'},
    {type: 'input', name: 'descricao', required: true, label: 'Descrição:'},
    {type: 'input', name: 'fabricante', label: 'Fabricante:'},
    {type: 'input', name: 'modelo', label: 'Tipo/Modelo:'},
    {type: 'input', name: 'fornecedor', label: 'Fornecedor:'},
    {type: 'input', name: 'media_valor', label: 'Valor aproximado R$:'},
    {type: 'combo', name: 'estrutura', label: 'Categoria', required: true},
    {type: 'newcolumn', offset: 20},
    {type: "image", name: "foto", url:  "./ws/foto.php",
        imageWidth: 300, imageHeight: 300,
        inputWidth: 305, inputHeight: 305}
];