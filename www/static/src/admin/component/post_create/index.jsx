import React from 'react';
import ReactDom from 'react-dom';
import Base from 'base';
import {Link} from 'react-router';
import classnames from 'classnames';
import Datetime from 'react-datetime';
import 'react-datetime/css/react-datetime.css';
import moment from 'moment';
import { Form, ValidatedInput, Radio, RadioGroup} from 'react-bootstrap-validation';

import PostAction from 'admin/action/post';
import PostStore from 'admin/store/post';
import CateAction from 'admin/action/cate';
import CateStore from 'admin/store/cate';
import TipAction from 'common/action/tip';
import firekylin from 'common/util/firekylin';

import './style.css';

export default class extends Base {
  constructor(props){
    super(props);
    this.state = {
      postSubmitting: false,
      draftSubmitting: false,
      postInfo: {
        cate: [],
        is_public: "1",
        create_time: moment().format('YYYY-MM-DD HH:mm:ss'),
        allow_comment: true
      },
      status: 3,
      cateList: []
    }

    this.type = 0;
    this.cate = {};
    this.id = this.props.params.id | 0;

  }

  componentWillMount() {
    this.listenTo(PostStore, this.handleTrigger.bind(this));
    this.listenTo(CateStore, cateList => this.setState({cateList}));

    CateAction.select();
    if(this.id){
      PostAction.select(this.id);
    }
  }
  /**
   * hanle trigger
   * @param  {[type]} data [description]
   * @param  {[type]} type [description]
   * @return {[type]}      [description]
   */
  handleTrigger(data, type){
    switch(type){
      case 'savePostFail':
        this.setState({draftSubmitting: false, postSubmitting: false});
        break;
      case 'savePostSuccess':
        TipAction.success(this.id ? '保存成功' : '添加成功');
        this.setState({draftSubmitting: false, postSubmitting: false});
        setTimeout(() => this.redirect('post/list'), 1000);
        break;
      case 'getPostInfo':
        data.create_time = moment( new Date(data.create_time) ).format('YYYY-MM-DD HH:mm:ss');
        this.setState({postInfo: data});
        break;
    }
  }
  /**
   * save
   * @return {}       []
   */
  handleValidSubmit(values){
    if( !this.state.status ) {
      this.setState({draftSubmitting: true});
    } else {
      this.setState({postSubmitting: true});
    }

    if(this.id){
      values.id = this.id;
    }

    values.status = this.state.status;
    values.type = this.type; //type: 0为文章，1为页面
    values.allow_comment = this.state.allow_comment;
    values.cate = Object.keys(this.cate).filter(item => this.cate[item]);
    PostAction.save(values);
  }
  /**
   * render
   * @return {} []
   */
  render(){
    let props = {}
    if(this.state.draftSubmitting || this.state.postSubmitting){
      props.disabled = true;
    }

    //如果是在编辑状态下在没有拿到数据之前不做渲染
    //针对 react-bootstrap-validation 插件在 render 之后不更新 defaultValue 做的处理
    if( this.id && !this.state.postInfo.content ) {
      return null;
    }

    let cateInitial = [];
    if( Array.isArray(this.state.postInfo.cate) ) {
      cateInitial = this.state.postInfo.cate.map( item => item.id );
    }

    //针对 RadioGroup 只有在值为字符串才正常的情况做处理
    if( firekylin.isNumber(this.state.postInfo.is_public) ) {
      this.state.postInfo.is_public += '';
    }

    //baseUrl
    let baseUrl = location.origin + '/' + ['post', 'page'][this.type] + '/';

    return (
      <Form
        model={this.state.postInfo}
        className="post-create clearfix"
        onValidSubmit={this.handleValidSubmit.bind(this)}
      >
        <div className="row">
          <div className="col-xs-9">
            <ValidatedInput
                name="title"
                type="text"
                placeholder="标题"
                validate="required"
                label={`${this.id ? '编辑' : '撰写'}${this.type ? '页面' : '文章'}`}
            />
            <div className="pathname">
              <span>{baseUrl}</span>
              <ValidatedInput name="pathname" type="text" validate="required" />
              <span>.html</span>
            </div>
            <ValidatedInput
                name="markdown_content"
                type="textarea"
                style={{minHeight: 300}}
                validate="required"
            />
            <div className="col-xs-12 text-right">
              <button
                type="submit"
                {...props}
                className="btn btn-default"
                onClick={()=> this.state.status = 0}
              >{this.state.draftSubmitting ? '保存中...' : '保存草稿'}</button>
              <span> </span>
              <button
                  type="submit"
                  {...props}
                  className="btn btn-primary"
                  onClick={()=> this.state.status = 3}
              >{this.state.postSubmitting ? '发布中...' : '发布文章'}</button>
            </div>
          </div>
          <div className="col-xs-3">
            <div style={{marginBottom: 15}}>
              <label>发布日期</label>
              <div>
                <Datetime
                  dateFormat="YYYY-MM-DD"
                  timeFormat="HH:mm:ss"
                  locale="zh-cn"
                  defaultValue={this.state.postInfo.create_time}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="control-label">分类</label>
              <ul>
                {this.state.cateList.map(cate =>
                  <li key={cate.id}>
                    <label>
                      <input
                          type="checkbox"
                          name="cate"
                          value={cate.id}
                          defaultChecked={cateInitial.includes(cate.id)}
                          onChange={()=> this.cate[cate.id] = !this.cate[cate.id]}
                      />
                      {cate.name}
                    </label>
                  </li>
                )}
              </ul>
            </div>
            <RadioGroup
              name="is_public"
              label="公开度"
              wrapperClassName="col-xs-12"
            >
              <Radio value="1" label="公开" />
              <Radio value="0" label="不公开" />
            </RadioGroup>
            <div className="form-group">
              <label className="control-label">权限控制</label>
              <div>
                <label>
                  <input
                      type="checkbox"
                      name="allow_comment"
                      checked={this.state.postInfo.allow_comment}
                      onChange={()=> {
                        this.state.postInfo.allow_comment = !this.state.postInfo.allow_comment;
                        this.forceUpdate();
                      }}
                  />
                  允许评论
                </label>
              </div>
            </div>
          </div>
        </div>
      </Form>
    );
  }
}