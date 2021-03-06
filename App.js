Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    
launch: function() {
    var that =  this;
        var millisecondsInDay = 86400000;
        var currentDate = new Date();
        var startDate = new Date(currentDate - millisecondsInDay*90); //in the last 90 days
        var startDateUTC = startDate.toISOString();
        
        this._filters = [
            {
                property : 'CreationDate',
                operator : '>=',
                value : startDateUTC
            }	
   	];
        
        Ext.create('Rally.data.WsapiDataStore',{
   		model: 'ConversationPost',
		autoLoad: true,
		remoteSort: false,
   		fetch: ['Artifact','Text','FormattedID','ScheduleState', 'Project'],
   		filters: this._filters,
                limit: Infinity,
                context: {
                    //project : "/project/10823784037", // ALM
                    projectScopeDown: true
                },
   		listeners: {
   		    load: that._onConversationsLoaded,
   		    scope:this
   		}
   	});

   },
   _onConversationsLoaded: function(store,data){
        var posts = [];
        _.each(data, function(post) {
            var text = post.get('Text');
            if (text.indexOf("associated to Salesforce")>=0) {
                text = text.match(/(<[Aa]\s(.*)<\/[Aa]>)/g);
                var p  = {
                    Case: text,
                    Name: post.get('Artifact').FormattedID,
                    Artifact: post.get('Artifact'),
                    ID: post.get('Artifact').FormattedID,
                    Project: post.get('Artifact').Project._refObjectName
                };
            posts.push(p);
            }
        });
        this._createGrid(posts);
   },
   
   _createGrid: function(posts) {
        var store = Ext.create('Rally.data.custom.Store', {
                data: posts,
                groupField: 'ID'  
            });
        this.grid = this.add({
            xtype: 'rallygrid',
            itemId: 'mygrid',
            store: store,
            features: [{ftype:'groupingsummary'}],
            columnCfgs: [
                {
                   text: 'Artifact', dataIndex: 'Artifact', renderer: function(value){
                        return '<a href="'+ Rally.nav.Manager.getDetailUrl(value) +'" target="_blank">' + value.FormattedID +'</a>'
                   }
                },
                {text: 'Case', dataIndex: 'Case',
                   summaryType: 'count',
                   summaryRenderer: function(value, summaryData, dataIndex) {
                    return ((value === 0 || value > 1) ? '(' + value + ' Cases)' : '(1 Case)');
                    }
                },
                {text: 'Project', dataIndex: 'Project'}
                
            ]
        });
    }

});