var React = require('react');
var delay = 3000;
var isLoading = false;
var isDirty = false;

var SearchField = React.createClass({

	getInitialState() {
		return { value: '' };
	},

	handleChange(event) {
		var self = this;
		isDirty = true;
		reloadSearch();
		function reloadSearch() {
			if(!isLoading){
				var q = $('#address').val();
				if (q.length >= 3) {
					isLoading = true;
					console.log(q)
					self.props.onFilterInput(
						q
					)
					setTimeout(function(){
						isLoading=false;
						if(isDirty){
							isDirty = false;
							reloadSearch();
						}
					}, delay);
				}
			}
		};
	},

	handleSubmit(event){
		event.preventDefault();
		this.props.onChooseType(this.state.value);
		this.getDOMNode().querySelector('input').blur();
	},
    componentDidMount(){

    },
	render() {
        var searchList = restaurants
            .map(function(data){
               return  <option>{data.title}</option>
            })
		return (
			<form id="geocoding_form" className="form-horizontal" onSubmit={this.handleSubmit}>
				<div className="form-group">
					<div className="col-xs-12">
						<div className="input-group">
							<input type="text" className="form-control" id="address" placeholder="Find a location..." 
							value={this.props.filterText} onChange={this.handleChange} list="search_list" />
                            <datalist id="search_list">
                                {searchList}
                            </datalist>
							<span className="input-group-btn">
								<span className="glyphicon glyphicon-search" aria-hidden="true"></span>
							</span>
						</div>
					</div>
				</div>
			</form>
		);

	}
});

module.exports = SearchField;